package controllers


import boot.{ApiKeyProtected, AppBoot}
import controllers.mongo.project.Project
import controllers.mongo.users.User
import play.api.mvc.WebSocket.FrameFormatter

import scala.collection.JavaConversions._
import scala.concurrent._
import io.toast.tk.dao.domain.impl.repository.{ProjectImpl, ElementImpl}
import io.toast.tk.swing.agent.interpret.MongoRepositoryCacheWrapper
import controllers.mongo.{Repository, MongoConnector, MappedWebEventRecord}
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

import scala.util.{Failure, Success}


case class RecordedSentence(sentence:String, ids:List[String])
case class AgentInformation(token: String, host: String, isAlive: Option[Boolean] = Some(true), sentence: Option[RecordedSentence] = None)

object AgentController extends Controller{

  /**
   * every user has his own channel
   */
  val users = Map[String, (Enumerator[AgentInformation], Concurrent.Channel[AgentInformation])]()
  val agents = Map[String, AgentInformation]()
  val agentSockets = Map[String, (Enumerator[AgentInformation], Concurrent.Channel[AgentInformation])]()

  implicit val recordSentenceFormat = Json.format[RecordedSentence]
  implicit val agentInfoFormat = Json.format[AgentInformation]
  implicit val wsAgentInfoFormatter = FrameFormatter.jsonFrame[AgentInformation]
  val db: MongoConnector = AppBoot.db

  /**
   * 5 seconds agent checkAlive
   
  Future {
    while (true) {
      Thread.sleep(5 * 1000)
      if (agents.size > 0) {
        Logger.debug(s"Checking ${agents.size} agents status.." )
      }
      for(agent <- agents){
        Future {
          val agentPort = 4444
          val url = "http://" + agent._2.host.split(":")(0) + ":" + agentPort + "/record/ping"
          Logger.debug(s"Pinging url - $url" )
          import play.api.Play.current
          WS.url(url).withRequestTimeout(5 * 1000).get().onComplete(
            _ match {
              case Success(response) => {
                if(response.status == 200){
                  Logger.debug(s"Agent @host(${agent._2.host}) is alive !")
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
    agentSockets -= token
    val agentInformation = AgentInformation(token, host, Some(false))
    users(token)._2.push(agentInformation)
  }


  /**
    * register a stream to validate
    * incoming sentences to.
    * @return
    */
  def agentStreamWebsocketService (agentToken: String) =  WebSocket.using[AgentInformation] {
    request => {
      Logger.info(s"-> Agent: New incoming websocket connection -> ${agentToken}" )

      val (enumerator, channel): (Enumerator[AgentInformation], Concurrent.Channel[AgentInformation]) = Concurrent.broadcast[AgentInformation]

      hasUserAndProject(agentToken) match {
        case true => {
          if(agentSockets contains agentToken) {
            Logger.info(s"Ignoring new request, agent already registred <- token -> $agentToken")
            (Iteratee.ignore[AgentInformation], agentSockets(agentToken)._1)
          }
          else {
            agentSockets += ((agentToken, (enumerator, channel)))
            val iteratee = Iteratee.foreach[AgentInformation](msg => {
              //exisiting
            }).map{ _ => {
              Logger.info(s"agent disconnected <- token -> $agentToken")
              agentSockets(agentToken)._2.eofAndEnd()
              agentSockets -= agentToken
              agents -= agentToken
            }}
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
   * register the front end socket channel to publish
   * incoming sentences to.
   * @return
   */
  def registerFrontWebsocketService (maybeToken: Option[String]) =  WebSocket.using[AgentInformation] {
    request => {
      Logger.info(s"-> Browser: New incoming websocket connection -> ${request.headers}" )
      //open websocket only for local host !
      //TODO: check request host !

      maybeToken match {
        case Some(userTokenValue) => {
          Logger.info(s"New incoming websocket connection <- token -> $userTokenValue")
          hasUserAndProject(userTokenValue) match {
            case true => {
              if(users contains userTokenValue) {
                Logger.info(s"Ignoring new request, user already connected <- token -> $userTokenValue")
                (Iteratee.ignore[AgentInformation], users(userTokenValue)._1)
              }
              else {
                val (enumerator, channel): (Enumerator[AgentInformation], Concurrent.Channel[AgentInformation]) = Concurrent.broadcast[AgentInformation]
                users += ((userTokenValue, (enumerator, channel)))
                val iteratee = Iteratee.foreach[AgentInformation](msg => {
                  //do something with the message
                }).map{ _ => {
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
        case _ => {
          Logger.info(s"No token provided, websocket connection request ignored")
          (Iteratee.ignore[AgentInformation], Enumerator.empty[AgentInformation].andThen(Enumerator.eof))
        }
      }
    }
  }

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
   * List of agents registered with provided token
   * Limited to 1 for the time being
   * @param token
   * @return
   */
  def getAgents(token: String) = Action {
    if(agents.keySet.exists(_ == token)){
      Ok(Json.toJson(List(agents(token))))
    }else {
      Ok(Json.toJson(List[AgentInformation]()))
    }
  }


  /**
   * Any agent that may push sentences, will be registered here
   *
   * @param AgentInformation (host and user token)
   * @return
   */
  @ApiKeyProtected
  def subscribe(): Action[JsValue] = Action(parse.json) {
    implicit request => {
      Logger.info("Processing new subscription request from host: " + request.host)
      request.body.validate[AgentInformation].map {
        case agentInformation:AgentInformation => {
              agents += ((agentInformation.token, agentInformation))
              if(users contains agentInformation.token) {
                val agentInformationToPublish = AgentInformation(agentInformation.token, request.host, Some(true))
                users(agentInformation.token)._2.push(agentInformationToPublish)
              }
              Logger.info(s"Agent registration accepted for token -> ${agentInformation.token} - @host(${request.host})")
              Ok("driver registered: " + agentInformation.host)
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
  @ApiKeyProtected
  def publishRecordedAction = Action.async(parse.json) {
    implicit request => {
      implicit val recordFormat = Json.format[MappedWebEventRecord]
      val maybeToken = request.headers.get("Token")

      maybeToken match {
        case Some(token) => {
          if(agents contains token){
            request.body.validate[MappedWebEventRecord].map {
              case webEventRecord:MappedWebEventRecord => {
                db.userProjectPair(token) match {
                  case (Some(user), Some(project)) => {
                    val sentence = buildFormat(webEventRecord, project)
                    sentence match {
                      case Some(s) => {
                        val agents1: AgentInformation = agents(token)
                        val agentInformation = AgentInformation(agents1.token, agents1.host, Some(true), sentence)
                        users(token)._2.push(agentInformation)
                        Future.successful{
                          Ok("event processed !")
                        }
                      }
                      case None =>
                        Logger.info(s"No sentence for provided event")
                        Future.successful{
                          Ok("No sentence for provided event !")
                        }
                    }
                  }
                  case _ => Future.successful{
                    BadRequest(s"No Project/User pair found for @token($token)")
                  }
                }

              }
            }.recoverTotal {
              e => Future.successful{
                BadRequest("Detected error:" + JsError.toJson(e))
              }
            }
          } else {
            Future.successful {
              BadRequest(s"Detected error: Agent not registered with @token($token)")
            }
          }
        }
        case None => {
          Future.successful{
            BadRequest(s"Token Rejected @token($maybeToken)")
          }
        }
      }
    }
  }

  private def buildFormat(mappedEventRecord:MappedWebEventRecord, project: Project): Option[RecordedSentence] = {
    val mongoCacheWrapper:MongoRepositoryCacheWrapper = new MongoRepositoryCacheWrapper(DAOJavaWrapper.repositoryDaoService)
    val interpretationProvider:InterpretationProvider = new InterpretationProvider(mongoCacheWrapper)
    val interpret:IActionInterpret  = interpretationProvider.getSentenceBuilder(mappedEventRecord.component.getOrElse(""));
    interpret match {
      case null => None
      case interpret:IActionInterpret => {
        val eventRecord:WebEventRecord = asWebEventRecord(mappedEventRecord)
        val projectImpl:ProjectImpl = asProjectImpl(project)
        val sentence:String = interpret.getSentence(eventRecord, projectImpl)
        if (interpret.getRepository() == null) {
          Some(RecordedSentence(sentence, List()))
        }
        else {
            mongoCacheWrapper.saveRepository(interpret.getRepository())
            val rows:List[ElementImpl] = interpret.getElements().toList
            val ids:List[String] = rows.map(e => e.getIdAsString)
            val record: RecordedSentence = RecordedSentence(sentence, ids)
            Some(record)
        }
      }
    }
  }

  private def asProjectImpl(project: Project): ProjectImpl ={
    val projectImpl:ProjectImpl = new ProjectImpl();
    projectImpl.setDescription(project.description.getOrElse(""))
    projectImpl.setName(project.name)
    projectImpl.setId(project._id.get.stringify)
    projectImpl
  }

  private def asWebEventRecord(record: MappedWebEventRecord): WebEventRecord = {
    val eventRecord:WebEventRecord = new WebEventRecord();
    eventRecord.setId(record.id.getOrElse(""))
    eventRecord.setComponent(record.component.getOrElse(""))
    eventRecord.setComponentName(record.componentName.getOrElse(""))
    eventRecord.setParent(record.parent.getOrElse(""))
    eventRecord.setValue(record.value.getOrElse(""))
    eventRecord.setTarget(record.target.getOrElse(""))
    eventRecord.setPath(record.path.getOrElse(""))
    eventRecord.setEventType(record.eventType.getOrElse(""))
    eventRecord
  }


}
