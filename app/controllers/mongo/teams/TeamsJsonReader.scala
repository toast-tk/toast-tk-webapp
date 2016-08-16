package controllers.mongo.teams

import controllers.mongo.BSONObjectIdFormats
import play.api.libs.json._
import reactivemongo.bson._

case class Team(_id: Option[BSONObjectID] = Some(BSONObjectID.generate), name: String, description: String)

object Team extends BSONObjectIdFormats {
  implicit val teamJsonHandler = Json.format[Team]
  implicit val teamReader: BSONDocumentReader[Team] = Macros.reader[Team]
  implicit val teamWrtier: BSONDocumentWriter[Team] = Macros.writer[Team]
}


