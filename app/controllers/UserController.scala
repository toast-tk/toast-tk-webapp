package controllers

import boot.AppBoot
import com.google.gson.JsonObject
import controllers.mongo.MongoConnector
import controllers.mongo.project.Project
import controllers.mongo.teams.Team
import controllers.mongo.users._
import play.api.mvc._
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global

import reactivemongo.bson.{BSONDocument, BSONObjectID}

import scala.concurrent._
import scala.concurrent.duration.Duration
import scala.util.{Failure, Success, Try}

object UserController extends Controller with InnerUserController

trait InnerUserController {
  this: Controller =>

  private val conn = AppBoot.conn

	def user(id: String) = Action.async {
		conn.editUser(id).map {
	        user => {
	        	Ok(Json.toJson(user).as[JsObject] - "password")
	   		}
    }
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
				user._id match {
						case None => {
							val userWithId : User = User(user.login, user.password,
                                           user.firstName, user.lastName,
                                           user.email, user.teams)

							Await.ready(conn.saveUser(userWithId), Duration.Inf).value.get match {
								case Failure(e) => {
                  throw e
                }
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
						case _ => {
							Await.ready(conn.saveUser(user), Duration.Inf).value.get match {
								case Failure(e) => {
                  throw e
                }
								case Success(isInserted) => {
									isInserted match {
										case true => { Ok(Json.toJson(user)) }
										case false => { BadRequest("save err: Node already exists")}
									}
								}
							}
						}
					}
				}.recoverTotal {
					e => BadRequest("Detected error:" + JsError.toJson(e))
				}
		}

	def getAllUsers() = Action.async {
		conn.getAllUsers().map {
      users => {
        val publicUserList = users.map {
          user =>
          Json.toJson(user).as[JsObject] - "password"
        }
        Ok(Json.toJson(publicUserList))
      }
    }
	}

	def deleteUser(id: String) = Action {
		Await.ready(conn.removeUser(id), Duration.Inf).value.get match {
			case Failure(e) => {
        throw e
      }
			case Success(lasterror) => {
        Ok("successfully removed user")
			}
		}
	}

  def getUserProjects(id: String) = Action {
    val result: Option[User] = Await.result(conn.editUser(id), Duration.Inf)
    result match {
      case Some(user)=> {
        val proxyTeams:List[Team] = user.teams.getOrElse(List());
        val resultTeams: List[Team] = for (proxyTeam <- proxyTeams;
                                     team <- Await.result(conn.getTeam(proxyTeam._id.get.stringify),Duration.Inf)) yield (team)
        val result: List[JsObject] = for (team <- resultTeams; project <- team.projects)
          yield (Json.obj("team" -> team.name, "project" -> Json.toJson(project)))
        Ok(Json.toJson(result))
      }
      case None => BadRequest("No user found with provided id !")
    }
  }
  
}