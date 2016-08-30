package controllers

import java.io.Serializable
import java.util.concurrent.TimeUnit

import boot.AppBoot
import controllers.mongo.teams.Team
import controllers.mongo.users._
import play.api.mvc._
import play.api.libs.json._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent._
import scala.concurrent.duration.Duration
import scala.util.{Failure, Success, Try}

object UserController extends Controller with InnerUserController

trait InnerUserController {
  this: Controller =>

  private val db = AppBoot.db
  val timeout = Duration(5, TimeUnit.SECONDS)

	def user(id: String) = Action.async {
		db.editUser(id).map {
	        user => {
	        	Ok(Json.toJson(user).as[JsObject] - "password")
	   		}
    }
	}

	def logout(id: String) = Action {
		Await.ready(db.disconnectUser(id), timeout).value.get match {
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
              val userToken: String = user.token.getOrElse(BearerTokenGenerator.generateToken())
							val userWithId : User = User(user.login, user.password,
                                           user.firstName, user.lastName,
                                           user.email, user.teams, Some(userToken))

							Await.ready(db.saveUser(userWithId), timeout).value.get match {
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
							Await.ready(db.saveUser(user), timeout).value.get match {
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
		db.getAllUsers().map {
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
		Await.ready(db.removeUser(id), timeout).value.get match {
			case Failure(e) => {
        throw e
      }
			case Success(lasterror) => {
        Ok("successfully removed user")
			}
		}
	}

  def getUserProjects(id: String) = Action {
    val result: Option[User] = Await.result(db.editUser(id), timeout)
    result match {
      case Some(user)=> {
        val proxyTeams:List[Team] = user.teams.getOrElse(List());
        val resultTeams: List[Team] = for (proxyTeam <- proxyTeams;
                                     team <- Await.result(db.getTeam(proxyTeam._id.get.stringify), timeout)) yield (team)
        val result: List[JsObject] = for (team <- resultTeams; project <- team.projects)
          yield (Json.obj("team" -> team.name, "project" -> Json.toJson(project)))
        Ok(Json.toJson(result))
      }
      case None => BadRequest("No user found with provided id !")
    }
  }
  
}