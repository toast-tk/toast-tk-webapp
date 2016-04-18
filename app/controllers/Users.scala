package controllers

import boot.AppBoot

import play.api.mvc._
import play.api.libs.json.Json
import controllers.mongo._
import reactivemongo.bson.{BSONObjectID, BSONDocument}
import play.api.libs.json._

import scala.concurrent._
import scala.concurrent.duration.Duration
import scala.util.{Try, Success, Failure}

object Users extends Controller {

  private val conn = AppBoot.conn

	def user(id: Long) = Action {
		Ok(Json.obj("firstName" -> "Sallah", "lastName" -> "Kokaina", "age" -> 31))
	}

	def logout(id: String) = Action {
		Await.ready(conn.disconnectUser(id), Duration.Inf).value.get match {
			case Failure(e) => throw e
			case Success(isInserted) => {
				isInserted match {
					case true => {
						Ok("Successfully Disconnected")
					}
					case false => { BadRequest("User not found, Could not disconnect properly !")}
				}
			}
		}
	}

	def saveUser() = Action(parse.json) { implicit request =>
		request.body.validate[User].map {
			case user: User =>
			user.id match {
				case None => {
					val userWithId : User = User(Some(BSONObjectID.generate.stringify),
						user.login,
						user.password,
						user.firstName,
						user.lastName,
						user.email,
						user.teams, None, true, None
						)
					Await.ready(conn.saveUser(userWithId), Duration.Inf).value.get match {
						case Failure(e) => throw e
						case Success(isInserted) => {
							isInserted match {
								case true => {
									val flatResponse = Json.toJson(userWithId).as[JsObject]
									Ok(Json.toJson(flatResponse))
								}
								case false => { BadRequest("Node already exists")}
							}
						}
					}
				}
/*				case _ => {
					Await.ready(conn.saveScenario(scenario), Duration.Inf).value.get match {
						case Failure(e) => throw e
						case Success(isInserted) => {
							isInserted match {
								case true => {
									Ok(Json.toJson(scenario))
								}
								case false => { BadRequest("save err: Node already exists")}
							}
						}
					}
				}*/
			}
			}.recoverTotal {
				e => BadRequest("Detected error:" + JsError.toJson(e))
			}
		}

}