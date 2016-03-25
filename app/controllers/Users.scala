package controllers

import play.api.mvc._
import play.api.libs.json.Json

object Users extends Controller {

	def user(id: Long) = Action {
		Ok(Json.obj("firstName" -> "Sallah", "lastName" -> "Kokaina", "age" -> 31))
	}
}