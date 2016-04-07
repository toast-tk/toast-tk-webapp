package controllers


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
    eventRecord.setId(record.id)
    eventRecord.setComponent(record.component)
    eventRecord.setComponentName(record.componentName)
    eventRecord.setParent(record.parent)
    eventRecord.setValue(record.value)
    eventRecord.setTarget(record.target)
    eventRecord.setType(record.eventType)
    eventRecord
  }

  def buildFormat(mappedEventRecord:MappedWebEventRecord): Option[String] = {
    val interpret:IActionInterpret  = interpretationProvider.getSentenceBuilder(mappedEventRecord.component);
    if (interpret == null){
      None
    }
    else{
      val eventRecord:WebEventRecord = getRecord(mappedEventRecord)
      val sentence:String = interpret.getSentence(eventRecord)
      Some(sentence)
    }
  }

}
