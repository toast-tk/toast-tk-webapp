package controllers.mongo.scenario

import controllers.mongo.{BSONObjectIdFormats, Identifiable}
import controllers.mongo.project.Project
import play.api.libs.json.Json
import reactivemongo.bson._


case class Scenario(
                     name: String,
                     `type`: String,
                     driver: String,
                     rows: Option[String] = None,
                     parent: Option[String] = None,
                     project: Option[Project] = None,
                     override val _id: Option[BSONObjectID] = Some(BSONObjectID.generate)
                     ) extends Identifiable

object Scenario extends BSONObjectIdFormats {

  implicit val jsonHandler = Json.format[Scenario]
  implicit val bsonWriter: BSONDocumentWriter[Scenario] = Macros.writer[Scenario]
  implicit val bsonReader: BSONDocumentReader[Scenario] = Macros.reader[Scenario]

}
