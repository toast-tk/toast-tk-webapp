package controllers


import boot.AppBoot
import controllers.mongo.project.Project
import controllers.mongo.users.User
import play.api.mvc.WebSocket.FrameFormatter

import scala.collection.JavaConversions._
import scala.concurrent._
import io.toast.tk.dao.domain.impl.repository.{ElementImpl}
import io.toast.tk.swing.agent.interpret.MongoRepositoryCacheWrapper
import controllers.mongo.{MongoConnector, MappedWebEventRecord}
import play.api.Logger
import scala.concurrent.duration._
import play.api.libs.ws._
import play.api.libs.json.{JsValue, JsError, Json}
import play.api.mvc._
import play.api.libs.iteratee._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.collection.mutable._
import io.toast.tk.core.agent.interpret.WebEventRecord
import io.toast.tk.action.interpret.web.{InterpretationProvider, IActionInterpret}
import toast.engine.DAOJavaWrapper


case class RecordedSentence(sentence:String, ids:List[String])
case class AgentInformation(token: String, host: String, isAlive: Option[Boolean] = Some(true), sentence: Option[RecordedSentence] = None)

object AgentController extends Controller{

  /**
   * every user has his own channel
   */
  val users = Map[String, (Enumerator[AgentInformation], Concurrent.Channel[AgentInformation])]()
  val agents = Map[String, AgentInformation]()

  implicit val recordSentenceFormat = Json.format[RecordedSentence]
  implicit val agentInfoFormat = Json.format[AgentInformation]
  implicit val wsAgentInfoFormatter = FrameFormatter.jsonFrame[AgentInformation]

  val mongoCacheWrapper:MongoRepositoryCacheWrapper = new MongoRepositoryCacheWrapper()
  mongoCacheWrapper.initCache(DAOJavaWrapper.repositoryDaoService);
  val interpretationProvider:InterpretationProvider = new InterpretationProvider(mongoCacheWrapper)
  val db: MongoConnector = AppBoot.db


  /**
   * 5 seconds agent checkAlive
   */
  /**Future {
    while (true) {
      Thread.sleep(5 * 1000);
      if (agents.size > 0) {
        Logger.info(s"Checking ${agents.size} agents status.." )
      }
      for(agent <- agents){
        Future {
          val agentPort = 4444
          val url = "http://" + agent._2.host.split(":")(0) + ":" + agentPort + "/record/ping"
          Logger.info(s"Pinging url - $url" )
          import play.api.Play.current
          WS.url(url).withRequestTimeout(5 * 1000).get().onComplete(
            _ match {
              case Success(response) => {
                if(response.status == 200){
                  Logger.info(s"Agent @host(${agent._2.host}) is alive !")
                }else {
                  unregisterAgent(agent._2.token, agent._2.host)
                  Logger.warn(s"Agent @host(${agent._2.host}) returned ${response.status} - removed from registry!")
                }
              }
              case Failure(ex) => {
                val message:String = ex.getMessage()
                unregisterAgent(agent._2.token, agent._2.host)
                Logger.error(s"Agent @host(${agent._2.host}) ping error -> ${message} - removed from registry!")
              }
            }
          )
        }
      }
    }
  }*/

  private def unregisterAgent(token: String, host: String): Unit ={
    agents -= token
    val agentInformation = AgentInformation(token, host, Some(false))
    users(token)._2.push(agentInformation)
  }

  /**
   * register the front end socket channel to publish
   * incoming sentences to.
   * @return
   */
  def registerFrontWebsocketService (userToken: Option[String]) =  WebSocket.using[AgentInformation] {
    request => {
      Logger.info(s"New incoming websocket connection -> ${request.headers}" )
      val userTokenValue = userToken.get
      Logger.info(s"New incoming websocket connection <- token -> $userTokenValue")
      hasUserAndProject(userTokenValue) match {
        case true => {
          if(users contains userTokenValue) {
            /**
             * existing user
             */
            Logger.info(s"Ignoring new request, user already connected <- token -> $userTokenValue")
            (Iteratee.ignore[AgentInformation], users(userTokenValue)._1)
          }
          else {
            val (enumerator, channel): (Enumerator[AgentInformation], Concurrent.Channel[AgentInformation]) = Concurrent.broadcast[AgentInformation]
            users += ((userTokenValue, (enumerator, channel)))
            val iteratee = Iteratee.foreach[AgentInformation](msg => {
              //do something with the message
            }).map{ _ => {
              /**
               * user closed his websocket client, so remove the user
               */
              users(userTokenValue)._2.eofAndEnd()
              users -= userTokenValue
            }}
            Logger.info(s"Websocket approved, user connected <- token -> $userTokenValue")
            (iteratee, enumerator)
          }
        }
        case false => {
          (Iteratee.ignore[AgentInformation], Enumerator.empty[AgentInformation].andThen(Enumerator.eof))
        }
      }
    }
  }


  /**
   * Check if provided token belongs to a user having a default project
   * @param token
   * @return
   */
  private def hasUserAndProject(token: String): Boolean = {
    val pair: (Option[User], Option[Project]) = db.userProjectPair(token)
    pair match {
      case (Some(user), Some(project)) => {
        true
      }
      case _ => false
    }
  }

  /**
   * Any agent that may push sentences, will be registered here
   *
   * @param AgentInformation (host and user token)
   * @return
   */
  def subscribe(): Action[JsValue] = Action(parse.json) {
    implicit request => {
      request.body.validate[AgentInformation].map {
        case agentInformation:AgentInformation =>
          val requestHost = request.headers.get("Host").get
          val maybeToken = request.headers.get("Token")
          hasUserAndProject(agentInformation.token) match {
            case true => {
              agents += ((agentInformation.token, agentInformation))

              val agentInformationToPublish = AgentInformation(agentInformation.token, agentInformation.host, Some(true))
              users(agentInformation.token)._2.push(agentInformationToPublish)
              Logger.info(s"Agent registration accepted for token -> ${agentInformation.token}")
              Ok("driver registered: " + agentInformation.host)
            }
            case false => {
              Logger.warn(s"Agent registration rejected for token -> ${agentInformation.token}")
              BadRequest("Detected error: No user or project found for provided token")
            }
          }
      }.recoverTotal {
        e => BadRequest("Detected error:" + JsError.toJson(e))
      }
    }
  }

  /**
   * Recorded actions endpoint
   *
   * @return
   */
  def publishRecordedAction = Action(parse.json) {
    implicit request => {
      implicit val recordFormat = Json.format[MappedWebEventRecord]
      val maybeToken = request.headers.get("Token")
      maybeToken match {
        case Some(token) => {
          request.body.validate[MappedWebEventRecord].map {
            case webEventRecord:MappedWebEventRecord => {
              val sentence = buildFormat(webEventRecord)
              sentence match {
                case Some(s) => {
                  val agents1: AgentInformation = agents(token)
                  val agentInformation = AgentInformation(agents1.token, agents1.host, Some(true), sentence)
                  users(token)._2.push(agentInformation)
                }
                case None => Logger.info(s"No sentence for provided")
              }
              Ok("event processed !")
            }
          }.recoverTotal {
            e => BadRequest("Detected error:" + JsError.toJson(e))
          }
        }
        case None => {
          BadRequest("Token Rejected -> " + maybeToken)
        }
      }
    }
  }

  def asWebEventRecord(record: MappedWebEventRecord): WebEventRecord = {
    val eventRecord:WebEventRecord = new WebEventRecord();
    eventRecord.setId(record.id.getOrElse(""))
    eventRecord.setComponent(record.component.getOrElse(""))
    eventRecord.setComponentName(record.componentName.getOrElse(""))
    eventRecord.setParent(record.parent.getOrElse(""))
    eventRecord.setValue(record.value.getOrElse(""))
    eventRecord.setTarget(record.target.getOrElse(""))
    eventRecord.setEventType(record.eventType.getOrElse(""))
    eventRecord
  }

  def buildFormat(mappedEventRecord:MappedWebEventRecord): Option[RecordedSentence] = {
    val interpret:IActionInterpret  = interpretationProvider.getSentenceBuilder(mappedEventRecord.component.getOrElse(""));
    interpret match {
      case null => None
      case interpret:IActionInterpret => {
        val eventRecord:WebEventRecord = asWebEventRecord(mappedEventRecord)
        val sentence:String = interpret.getSentence(eventRecord)
        if(mongoCacheWrapper.getLastKnownContainer != null){
          mongoCacheWrapper.saveLastKnownContainer()
          val rows:List[ElementImpl] = interpret.getElements().toList
          val ids:List[String] = rows.map(e => e.getIdAsString)
          val record: RecordedSentence = RecordedSentence(sentence, ids)
          interpret.clearElements()
          Some(record)
        }else{
          Some(RecordedSentence(sentence, List()))
        }
      }
    }
  }

}
