package controllers.mongo.users

import controllers.mongo.{Identifiable, BSONObjectIdFormats}
import controllers.mongo.teams.Team
import play.api.libs.functional.syntax._
import play.api.libs.json._
import play.api.libs.json.Writes._
import play.api.libs.json.Reads._
import reactivemongo.bson._

case class InspectedUser(login: String, password: String)
case class User(login: String,
                password: Option[String],
                firstName: String,
                lastName: String,
                email: String,
                teams:  Option[List[Team]],
                token : Option[String] = None,
                isActive : Option[Boolean] = Some(true),
                lastConnection : Option[String] = Some("11/11/1111"),
                override val _id: Option[BSONObjectID] = Some(BSONObjectID.generate),
                idProject: Option[String] = None) extends Identifiable


object User extends BSONObjectIdFormats {
  implicit val userJsonHandler = Json.format[User]
  implicit val userReader: BSONDocumentReader[User] = Macros.reader[User]
  implicit val userWriter: BSONDocumentWriter[User] = Macros.writer[User]
}

object InspectedUser{
  implicit val reader: Reads[InspectedUser]= (
    (__ \ "login").read[String] and
    (__ \ "password").read[String])(InspectedUser.apply(_,_))

  implicit val writer: Writes[InspectedUser] = (
      (__ \ "login").write[String] and
      (__ \ "password").write[String])(unlift(InspectedUser.unapply))
}