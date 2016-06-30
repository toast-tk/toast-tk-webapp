package controllers

import boot.AppBoot
import controllers.mongo.users._
import play.api.mvc._
import play.api.libs.json.Json
import scala.concurrent.ExecutionContext.Implicits.global

import reactivemongo.bson.{BSONDocument, BSONObjectID}
import play.api.libs.json._

import scala.concurrent._
import scala.concurrent.duration.Duration
import scala.util.{Failure, Success, Try}

object Users extends Controller {

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
				user.id match {
						case None => {
							val userWithId : User = User(Some(BSONObjectID.generate.stringify),
                                            user.login, user.password, user.firstName, user.lastName,
                                            user.email, user.teams, None, Some(false), None)

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
				println("successfully removed document")
        Ok("successfully removed document")
			}
		}
	}

}