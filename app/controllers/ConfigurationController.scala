package controllers

import boot.{JwtProtected, AppBoot}
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import controllers.mongo.MacroConfiguration
import play.api.libs.json.{JsError, Json}
import play.api.mvc.{Controller, Action}


object ConfigurationController extends Controller {

  private val db = AppBoot.db

  /**
   * load to init configuration
   */
  @JwtProtected
  def loadConfiguration() = Action.async {
    db.loadConfiguration.map {
      configurations => {
        Ok(Json.toJson(configurations))
      }
    }
  }

  /**
   * Save Meta config
   */
  @JwtProtected
  def saveConfiguration() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[MacroConfiguration]].map {
      case configs: Seq[MacroConfiguration] =>
        for {
          conf <- configs
        } yield db.saveConfiguration(conf)
        Ok("configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

}
