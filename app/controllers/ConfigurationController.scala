package controllers

import boot.AppBoot
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import controllers.mongo.MacroConfiguration
import play.api.libs.json.{JsError, Json}
import play.api.mvc.{Controller, Action}


object ConfigurationController extends Controller {

  private val conn = AppBoot.conn

  /**
   * load to init configuration
   */
  def loadConfiguration() = Action.async {
    conn.loadConfiguration.map {
      configurations => {
        Ok(Json.toJson(configurations))
      }
    }
  }

  /**
   * Save Meta config
   */
  def saveConfiguration() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[MacroConfiguration]].map {
      case configs: Seq[MacroConfiguration] =>
        for {
          conf <- configs
        } yield conn.saveConfiguration(conf)
        Ok("configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

}
