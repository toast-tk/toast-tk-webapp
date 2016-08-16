package controllers.mongo.teams

import play.api.libs.json._
import reactivemongo.bson._


case class Team(id: Option[String], name: String, description: String)

object Team{
  implicit val teamJsonHandler = Json.format[Team]
  implicit val teamReader: BSONDocumentReader[Team] = Macros.reader[Team]
  implicit val teamWrtier: BSONDocumentWriter[Team] = Macros.writer[Team]
}
