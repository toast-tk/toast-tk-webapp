package controllers.mongo.users

import controllers.parsers.WebPageElement
import controllers.parsers.EntityField
import play.api.libs.functional.syntax._
import play.api.libs.json._
import play.api.libs.json.Writes._
import play.api.libs.json.Reads._
import reactivemongo.bson.BSONDocumentReader
import reactivemongo.bson.BSONDocument
import reactivemongo.bson.BSONDocumentWriter
import reactivemongo.bson.BSONObjectID

case class InspectedUser(login: String, password: String)
case class User(id: Option[String],
	login: String,
	password: String,
	firstName: String,
	lastName: String,
	email: String,
	teams:  Option[List[String]],
	token : Option[String],
	isActive : Option[Boolean],
	lastConnection : Option[String])



object User{
  implicit val reader: Reads[User]= (
      (__ \ "id").readNullable[String] and
      (__ \ "login").read[String] and
      (__ \ "password").read[String] and
      (__ \ "firstName").read[String] and
      (__ \ "lastName").read[String] and
      (__ \ "email").read[String] and
      (__ \ "teams").readNullable[List[String]] and
      (__ \ "token").readNullable[String] and
      (__ \ "isActive").readNullable[Boolean] and
      (__ \ "lastConnection").readNullable[String])(User.apply(_,_,_,_,_,_,_,_,_,_))

  implicit val writer: Writes[User] = (
      (__ \ "id").writeNullable[String] and
      (__ \ "login").write[String] and
      (__ \ "password").write[String] and
      (__ \ "firstName").write[String] and
      (__ \ "lastName").write[String] and
      (__ \ "email").write[String] and
      (__ \ "teams").writeNullable[List[String]] and
      (__ \ "token").writeNullable[String] and
      (__ \ "isActive").writeNullable[Boolean] and
      (__ \ "lastConnection").writeNullable[String])(unlift(User.unapply))

  implicit val userFormat = Json.format[User]
  
  implicit object BSONReader extends BSONDocumentReader[User] {
    def read(doc: BSONDocument): User = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val login = doc.getAs[String]("login").get
      val password = doc.getAs[String]("password").get
      val firstName = doc.getAs[String]("firstName").get
      val lastName = doc.getAs[String]("lastName").get
      val email = doc.getAs[String]("email").get
      val teams = doc.getAs[List[BSONObjectID]]("teams").getOrElse(List()).map(x => x.stringify)
      val token = doc.getAs[String]("token").getOrElse("")
      val isActive = doc.getAs[Boolean]("isActive").getOrElse(false)
      val lastConnection = doc.getAs[String]("lastConnection").getOrElse("11/11/1111")
      User(Option[String](id), login ,password, firstName, lastName, email,  Option[List[String]](teams), Option[String](token), Option[Boolean](isActive), Option[String](lastConnection))
    }
  }

  implicit object BSONWriter extends BSONDocumentWriter[User] {
    def write(user: User): BSONDocument =
      user.id match {
        case None =>  BSONDocument("login"-> user.login,
                                   "password"-> user.password,
                                   "firstName"-> user.firstName,
                                   "lastName" -> user.lastName,    
                                   "email" -> user.email,
                                   "teams" -> user.teams.getOrElse(List()),
                                   "token" -> user.token.getOrElse(""))
        case value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get),
                                                  "login" -> user.login,
                                                  "password" -> user.password,
                                                  "firstName"-> user.firstName,
                                                  "lastName" -> user.lastName,    
                                                  "email" -> user.email,
                                                  "teams" -> user.teams.getOrElse(List()),
                                                  "token" -> user.token.getOrElse(""),
                                                  "isActive" -> user.isActive.getOrElse(false),
                                                  "lastConnection" -> user.lastConnection.getOrElse("11/11/1111")
                                                  )
      }
  }
}

object InspectedUser{
  implicit val reader: Reads[InspectedUser]= (
    (__ \ "login").read[String] and
    (__ \ "password").read[String])(InspectedUser.apply(_,_))

    implicit val writer: Writes[InspectedUser] = (
      (__ \ "login").write[String] and
      (__ \ "password").write[String])(unlift(InspectedUser.unapply))
    }