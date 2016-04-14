package controllers


import scala.collection.JavaConversions._

import com.synaptix.toast.dao.domain.impl.repository.{ElementImpl, RepositoryImpl}
import com.synaptix.toast.swing.agent.interpret.MongoRepositoryCacheWrapper
import controllers.mongo.MappedWebEventRecord
import play.api.Logger
import play.api.libs.json.{JsError, JsResult, Json}
import play.api.mvc._
import play.api.libs.iteratee._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.collection.mutable
import com.synaptix.toast.core.agent.interpret.WebEventRecord
import com.synaptix.toast.action.interpret.web.{InterpretationProvider, IActionInterpret}
import toast.engine.ToastRuntimeJavaWrapper


case class RecordedSentence(sentence:String, ids:List[String])

object DriverController extends Controller{


  val drivers: mutable.Stack[String] = mutable.Stack[String]();
  var channel: Option[Concurrent.Channel[String]] = None
  val mongoCacheWrapper:MongoRepositoryCacheWrapper = new MongoRepositoryCacheWrapper()
  mongoCacheWrapper.initCache(ToastRuntimeJavaWrapper.repositoryDaoService);
  val interpretationProvider:InterpretationProvider = new InterpretationProvider(mongoCacheWrapper)


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
   * Any driver that may push sentences, will be registred here
   *
   * @param host
   * @return
   */
  def subscribeDriver(host: String) = Action {
    request => {
      drivers.push(host);
      channel.foreach(_.push("driver:" + host))
      Ok("driver registred: " + host)
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
    if (interpret == null){
      None
    }
    else{
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
