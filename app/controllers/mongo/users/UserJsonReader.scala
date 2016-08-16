package controllers.mongo.users

import controllers.mongo.teams.Team
import play.api.libs.functional.syntax._
import play.api.libs.json._
import play.api.libs.json.Writes._
import play.api.libs.json.Reads._
import reactivemongo.bson._

case class InspectedUser(login: String, password: String)
case class User(id: Option[String],
                login: String,
                password: Option[String],
                firstName: String,
                lastName: String,
                email: String,
                teams:  Option[List[Team]],
                token : Option[String],
                isActive : Option[Boolean],
                lastConnection : Option[String])


object User{
  implicit val userJsonHandler = Json.format[User]
  implicit val userReader: BSONDocumentReader[User] = Macros.reader[User]
  implicit val userWrtier: BSONDocumentWriter[User] = Macros.writer[User]

}

object InspectedUser{
  implicit val reader: Reads[InspectedUser]= (
    (__ \ "login").read[String] and
    (__ \ "password").read[String])(InspectedUser.apply(_,_))

  implicit val writer: Writes[InspectedUser] = (
      (__ \ "login").write[String] and
      (__ \ "password").write[String])(unlift(InspectedUser.unapply))
}