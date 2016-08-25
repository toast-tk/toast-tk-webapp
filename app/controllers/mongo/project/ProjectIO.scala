package controllers.mongo.project

import controllers.mongo.{Identifiable, BSONObjectIdFormats}
import play.api.libs.json.Json
import reactivemongo.bson.{BSONDocumentWriter, Macros, BSONDocumentReader, BSONObjectID}

import scala.concurrent.{Future, Promise}
import scala.util.{Success, Failure}


case class Project(name: String,
                   description: Option[String] = None,
                   override val _id: Option[BSONObjectID] = Some(BSONObjectID.generate)) extends Identifiable


object Project extends BSONObjectIdFormats {
  implicit val jsonHandler = Json.format[Project]
  implicit val bsonReader: BSONDocumentReader[Project] = Macros.reader[Project]
  implicit val bsonWriter: BSONDocumentWriter[Project] = Macros.writer[Project]
}