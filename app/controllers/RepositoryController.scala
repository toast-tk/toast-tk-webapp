
package controllers

import boot.AppBoot
import controllers.mongo.{RepositoryImpl}
import play.api.libs.json.{JsError, JsObject, JsArray, Json}
import play.api.mvc.{Controller, Action}
import toast.engine.DAOJavaWrapper
import play.api.libs.concurrent.Execution.Implicits.defaultContext

object RepositoryController extends Controller {

  private val db = AppBoot.db

  /**
   * load to init repository configuration
   */
  def loadAutoConfiguration(idProject: String) = Action.async {
      db.loadSwingPageRepository(idProject).map {
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
   * load to init repository configuration
   */
  def loadWebPageRepository(idProject: String) = Action.async {
    db.loadWebPageRepository(idProject).map {
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
    request.body.validate[Seq[RepositoryImpl]].map {
      case configs: Seq[RepositoryImpl] =>
        for {
          conf <- configs
        } yield db.saveAutoConfiguration(conf)
        Ok("auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  /**
  *
  * Delete an auto config
  */
  def deleteObject = Action(parse.json) { implicit request =>
    request.body.validate[String].map {
      case autoSetupId: String =>
        db.deleteObject(autoSetupId)
        Ok("object deleted !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  /**
   * Save Auto config block with test refactoring
   */
  def saveAutoConfigBlock() = Action(parse.json) { implicit request =>
    request.body.validate[RepositoryImpl].map {
      case config: RepositoryImpl =>
        db.saveAutoConfiguration(config)
        db.refactorScenarii(config)
        Ok("auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  /**
   * Load repository
   */
  def loadRepository() = Action {
    Ok(DAOJavaWrapper.repositoryDaoService.getRepoAsJson())
  }

  def saveRepository() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[RepositoryImpl]].map {
      case configs: Seq[RepositoryImpl] =>
        for {
          conf <- configs
        } yield db.saveAutoConfiguration(conf)
        Ok("auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

}
