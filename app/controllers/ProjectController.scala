
package controllers

import boot.AppBoot
import controllers.mongo.project.Project
import play.api.libs.json.{JsError, Json}
import play.api.mvc.{Action, Controller}

import scala.concurrent.Await
import scala.concurrent.duration.Duration

import play.api.libs.concurrent.Execution.Implicits.defaultContext

object ProjectController extends Controller {

  private val conn = AppBoot.conn

  /**
   * Save Project
   */
  def saveProject() = Action(parse.json) { implicit request =>
    request.body.validate[Project].map {
      case project: Project =>
        Await.ready(conn.saveProject(project), Duration.Inf)
        Ok("project saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  def getProject(idProject: String) = Action.async {
    conn.getProject(idProject).map{project => Ok(Json.toJson(project))}
  }

  def getAllProjects() = Action.async {
    conn.getAllProjects().map{projects => Ok(Json.toJson(projects))}
  }
}
