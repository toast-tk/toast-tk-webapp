import controllers.Application._
import play.api.libs.json._

val input = Json.arr(
    Json.obj("name" -> JsString("Watherhsip down"),
      "type" -> JsString("web page"),
      "rows" -> JsArray()),
    Json.obj("name" -> JsString("Youga down"),
      "type" -> JsString("swing page"),
      "rows" -> JsArray())
)

def extendedObject(obj: JsObject) = {
  obj + ("columns" -> autoSetupCtxProvider((obj \ "type").as[String]))
}

val out = for(i <- input.value) yield extendedObject(i.as[JsObject])


