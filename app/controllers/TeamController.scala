package controllers

import boot.AppBoot

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
			case team: Team =>
			team._id match {
				case None => {
					val teamWithId : Team = Team(Some(BSONObjectID.generate), team.name, team.description)
					Await.ready(conn.saveTeam(teamWithId), Duration.Inf).value.get match {
						case Failure(e) => throw e
						case Success(isInserted) => {
							isInserted match {
								case true => {
									val flatResponse = Json.toJson(teamWithId).as[JsObject]
									Ok(Json.toJson(flatResponse))
								}
								case false => { BadRequest("Team already exists")}
							}
						}
					}
				}
			}
			}.recoverTotal {
				e => BadRequest("Detected error:" + JsError.toJson(e))
			}
		}

		def getAllTeams() = Action.async {
			conn.getAllTeams().map {
				teams => {
					Ok(Json.toJson(teams))
				}
			}
		}

}