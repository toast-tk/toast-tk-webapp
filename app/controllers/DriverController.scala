package controllers


import boot.AppBoot

import scala.collection.JavaConversions._

import io.toast.tk.dao.domain.impl.repository.{ElementImpl, RepositoryImpl}
import io.toast.tk.swing.agent.interpret.MongoRepositoryCacheWrapper
import controllers.mongo.{MongoConnector, MappedWebEventRecord}
import play.api.Logger
import play.api.libs.json.{JsError, JsResult, Json}
import play.api.mvc._
import play.api.libs.iteratee._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.collection.mutable
import io.toast.tk.core.agent.interpret.WebEventRecord
import io.toast.tk.action.interpret.web.{InterpretationProvider, IActionInterpret}
import toast.engine.DAOJavaWrapper


case class RecordedSentence(sentence:String, ids:List[String])
case class AgentInformation(token: String, host: String)

object DriverController extends Controller{

  val drivers: mutable.Stack[AgentInformation] = mutable.Stack[AgentInformation]();
  var channel: Option[Concurrent.Channel[String]] = None
  val mongoCacheWrapper:MongoRepositoryCacheWrapper = new MongoRepositoryCacheWrapper()
  mongoCacheWrapper.initCache(DAOJavaWrapper.repositoryDaoService);
  val interpretationProvider:InterpretationProvider = new InterpretationProvider(mongoCacheWrapper)
  val db: MongoConnector = AppBoot.db


  /**
   * register the front end socket channel to publish
   * incoming sentences to.
   * @return
   */
  def registerFrontWebsocketService =  WebSocket.using[String] {
    request => {
      val out: Enumerator[String] = Concurrent.unicast(c => channel = Some(c))
      (Iteratee.ignore[String], out);
    }
  }


  /**
   * Check if provided token belongs to a user having a default project
   * @param token
   * @return
   */
  private def checkToken(token: String){
    db.hasValidToken(token);
  }

  /**
   * Any agente that may push sentences, will be registered here
   *
   * @param agentInformation
   * @return
   */
  def subscribeDriver() = Action(parse.json) {
    implicit request => {


      implicit val recordFormat = Json.format[AgentInformation]
      request.body.validate[AgentInformation].map {
        case agentInformation:AgentInformation =>
          checkToken(agentInformation.token)
          drivers.push(agentInformation);
          channel.foreach(_.push("driver:" + host))
          Ok("driver registered: " + agentInformation.host)
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

      request.body.validate[MappedWebEventRecord].map {
        case webEventRecord:MappedWebEventRecord =>
          val sentence = buildFormat(webEventRecord)
          sentence match{
            case Some(s) => channel.foreach(_.push("sentence: "+s))
            case None =>{
              Logger.info(s"No sentence for provided")
            }

          }
          Ok("event processed !")
      }.recoverTotal {
        e => BadRequest("Detected error:" + JsError.toJson(e))
      }
    }
  }

  def getRecord(record: MappedWebEventRecord): WebEventRecord = {
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
        val eventRecord:WebEventRecord = getRecord(mappedEventRecord)
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
