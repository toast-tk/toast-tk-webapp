package controllers


import boot.AppBoot
import controllers.mongo.project.Project
import controllers.mongo.users.User

import scala.collection.JavaConversions._

import io.toast.tk.dao.domain.impl.repository.{ElementImpl}
import io.toast.tk.swing.agent.interpret.MongoRepositoryCacheWrapper
import controllers.mongo.{MongoConnector, MappedWebEventRecord}
import play.api.Logger
import play.api.libs.json.{JsError, Json}
import play.api.mvc._
import play.api.libs.iteratee._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.collection.mutable._
import io.toast.tk.core.agent.interpret.WebEventRecord
import io.toast.tk.action.interpret.web.{InterpretationProvider, IActionInterpret}
import toast.engine.DAOJavaWrapper

case class RecordedSentence(sentence:String, ids:List[String])
case class AgentInformation(token: String, host: String)

object DriverController extends Controller{

  /**
   * every user has his own channel
   */
  val users = Map[String, (Enumerator[String], Concurrent.Channel[String])]()
  val agents = Map[String, AgentInformation]()


  val mongoCacheWrapper:MongoRepositoryCacheWrapper = new MongoRepositoryCacheWrapper()
  mongoCacheWrapper.initCache(DAOJavaWrapper.repositoryDaoService);
  val interpretationProvider:InterpretationProvider = new InterpretationProvider(mongoCacheWrapper)
  val db: MongoConnector = AppBoot.db

  /**
   * register the front end socket channel to publish
   * incoming sentences to.
   * @return
   */
  def registerFrontWebsocketService (userToken: Option[String]) =  WebSocket.using[String] {
    request => {
      Logger.info(s"New incoming websocket connection -> " + request.headers)
      val userTokenValue = userToken.get
      Logger.info(s"New incoming websocket connection <- token -> " + userTokenValue)
      hasUserAndProject(userTokenValue) match {
        case true => {
          if(users contains userTokenValue) {
            /**
             * existing user
             */
            val iteratee = Iteratee.ignore[String]
            (iteratee, users(userTokenValue)._1)
          }
          else {
            val (enumerator, channel): (Enumerator[String], Concurrent.Channel[String]) = Concurrent.broadcast[String]
            users += ((userTokenValue, (enumerator, channel)))
            val iteratee = Iteratee.foreach[String](msg => {
              //do something with the message
            }).map{ _ => {
              /**
               * user closed his websocket client, so remove the user
               */
              users(userTokenValue)._2.eofAndEnd()
              users -= userTokenValue
            }}
            (iteratee, enumerator)
          }
        }
        case false => {
          (Iteratee.ignore[String], Enumerator("No user, project found for token -> " + userTokenValue).andThen(Enumerator.eof))
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
   * Any agente that may push sentences, will be registered here
   *
   * @param Agent Information (host and user token)
   * @return
   */
  def subscribeDriver() = Action(parse.json) {
    implicit request => {
      implicit val recordFormat = Json.format[AgentInformation]
      request.body.validate[AgentInformation].map {
        case agentInformation:AgentInformation =>
          val requestHost = request.headers.get("Host").get
          val maybeToken = request.headers.get("Authorization")
          hasUserAndProject(agentInformation.token) match {
            case true => {
              agents += ((agentInformation.token, agentInformation))
              users(agentInformation.token)._2.push("driver:" + agentInformation.host)
              Logger.info(s"Agent registration accepted for token -> " + agentInformation.token)
              Ok("driver registered: " + agentInformation.host)
            }
            case false => {
              Logger.warn(s"Agent registration rejected for token -> " + agentInformation.token)
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
      val maybeToken = request.headers.get("Authorization")
      maybeToken match {
        case Some(token) => {
          request.body.validate[MappedWebEventRecord].map {
            case webEventRecord:MappedWebEventRecord => {
              val sentence = buildFormat(webEventRecord)
              sentence match {
                case Some(s) => users(token)._2.push("sentence: " + s)
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

  def buildFormat(mappedEventRecord:MappedWebEventRecord): Option[String] = {
    val interpret:IActionInterpret  = interpretationProvider.getSentenceBuilder(mappedEventRecord.component.getOrElse(""));
    interpret match {
      case null => None
      case interpret:IActionInterpret => {
        implicit val recordFormat = Json.format[RecordedSentence]
        val eventRecord:WebEventRecord = asWebEventRecord(mappedEventRecord)
        val sentence:String = interpret.getSentence(eventRecord)
        if(mongoCacheWrapper.getLastKnownContainer != null){
          mongoCacheWrapper.saveLastKnownContainer()
          val rows:List[ElementImpl] = interpret.getElements().toList
          val ids:List[String] = rows.map(e => e.getIdAsString)
          val record: RecordedSentence = RecordedSentence(sentence, ids)
          val recordAsJson:String = Json.toJson(record).toString()
          interpret.clearElements()
          Some(recordAsJson)
        }else{
          val record: RecordedSentence = RecordedSentence(sentence, List())
          val recordAsJson:String = Json.toJson(record).toString()
          Some(recordAsJson)
        }
      }
    }
  }

}
