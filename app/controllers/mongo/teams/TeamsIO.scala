package controllers.mongo.teams

import controllers.mongo.{Identifiable, BSONObjectIdFormats}
import controllers.mongo.project.Project
import play.api.libs.json.Json
import reactivemongo.bson._

case class Team(name: String,
                description: String,
                projects: List[Project] = List(),
                override val _id: Option[BSONObjectID] = Some(BSONObjectID.generate)) extends Identifiable

object Team extends BSONObjectIdFormats {
  implicit val jsonHandler = Json.format[Team]
  implicit val bsonReader: BSONDocumentReader[Team] = Macros.reader[Team]
  implicit val bsonWriter: BSONDocumentWriter[Team] = Macros.writer[Team]
}



