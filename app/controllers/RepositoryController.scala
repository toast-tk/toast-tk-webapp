
package controllers

import boot.AppBoot
import controllers.mongo.ServiceEntityConfig
import controllers.mongo.AutoSetupConfig
import play.api.libs.json.{JsError, JsObject, JsArray, Json}
import play.api.mvc.{Controller, Action}
import toast.engine.ToastRuntimeJavaWrapper
import play.api.libs.concurrent.Execution.Implicits.defaultContext

object RepositoryController  extends Controller {

  private val conn = AppBoot.conn

  /**
   * load to init repository configuration
   */
  def loadAutoConfiguration() = Action.async {
    conn.loadAutoConfiguration.map {
      repository => {
        val input = Json.toJson(repository).as[JsArray]
        def extendedObject(obj: JsObject) = {
          obj + ("columns" -> DomainController.autoSetupCtxProvider((obj \ "type").as[String]))
        }
        val response = for (i <- input.value) yield extendedObject(i.as[JsObject])
        Ok(Json.toJson(response))
      }
    }
  }

  /**
   * Save Auto config
   */
  def saveAutoConfig() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[AutoSetupConfig]].map {
      case configs: Seq[AutoSetupConfig] =>
        for {
          conf <- configs
        } yield conn.saveAutoConfiguration(conf)
        Ok("auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }


  /**
   * Save Service config block with test refactoring
   */
  def saveServiceConfigBlock() = Action(parse.json) { implicit request =>
    request.body.validate[ServiceEntityConfig].map {
      case config: ServiceEntityConfig =>
        conn.saveServiceEntityConfiguration(config)
        //conn.refactorScenarii(config)
        Ok("auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }

  /**
   * Save Auto config block with test refactoring
   */
  def saveAutoConfigBlock() = Action(parse.json) { implicit request =>
    request.body.validate[AutoSetupConfig].map {
      case config: AutoSetupConfig =>
        conn.saveAutoConfiguration(config)
        conn.refactorScenarii(config)
        Ok("auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }

  /**
   * Load repository
   */
  def loadRepository() = Action {
    Ok(ToastRuntimeJavaWrapper.repositoryDaoService.getRepoAsJson())
  }

  def saveRepository() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[AutoSetupConfig]].map {
      case configs: Seq[AutoSetupConfig] =>
        for {
          conf <- configs
        } yield conn.saveAutoConfiguration(conf)
        Ok("auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }

}
