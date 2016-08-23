package controllers

import boot.AppBoot
import controllers.ProjectController._

import play.api.mvc._
import play.api.libs.json.Json
import controllers.mongo._
import reactivemongo.bson.{BSONObjectID, BSONDocument}
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global

import scala.concurrent._
import scala.concurrent.duration.Duration
import scala.util.{Try, Success, Failure}

import controllers.mongo.teams._

object TeamController extends Controller {

  private val conn = AppBoot.conn

	def saveTeam() = Action(parse.json) { implicit request =>
		request.body.validate[Team].map {
			case team: Team => {
          Await.ready(conn.saveTeam(team), Duration.Inf).value.get match {
            case Failure(e) => throw e
            case Success(isInserted) => {
              isInserted match {
                case true => Ok(Json.toJson(team))
                case false => BadRequest("Team already exists")
              }
            }
          }
        }
    }.recoverTotal {
				e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  def getTeam(idTeam: String) = Action.async {
    conn.getTeam(idTeam).map{team => Ok(Json.toJson(team))}
  }

  def getAllTeams() = Action.async {
    conn.getAllTeams().map {
      teams => {
        Ok(Json.toJson(teams))
      }
    }
  }

}