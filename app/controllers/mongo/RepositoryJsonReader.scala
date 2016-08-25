package controllers.mongo

import controllers.mongo.project.Project
import controllers.parsers.WebPageElement
import play.api.libs.json._
import reactivemongo.bson.{BSONDocumentReader, BSONObjectID, BSONDocument, BSONDocumentWriter}

case class RepositoryImpl(id: Option[String],
                          name: String,
                          `type`: String,
                          rows: Option[List[WebPageElement]],
                          project: Option[Project])

object RepositoryImpl{

  implicit val jsonHandler = Json.format[RepositoryImpl]

  implicit object RepositoryWriter extends BSONDocumentWriter[RepositoryImpl] {
    def formatName(name: String): String = {
      name.trim.replace(" ", "_").replace("'", "_").replace("°", "_")
    }
    def write(repository: RepositoryImpl): BSONDocument = {
      val formatedName = formatName(repository.name)
      repository.id match {
        case None =>
          BSONDocument("name"-> formatedName,
                       "type" -> repository.`type`,
                       "rows" -> repository.rows.getOrElse(List()),
                       "project" -> repository.project.get
          )
        case value:Option[String] =>
          BSONDocument("_id" -> BSONObjectID(value.get),
                      "name"-> formatedName,
                      "type" -> repository.`type`,
                      "rows" -> repository.rows.getOrElse(List()),
                      "project" -> repository.project.get
          )
      }
    }
  }

  implicit object RepositoryReader extends BSONDocumentReader[RepositoryImpl] {
    def read(doc: BSONDocument): RepositoryImpl = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val `type` = doc.getAs[String]("type").get
      val rows = doc.getAs[List[WebPageElement]]("rows").getOrElse(List())
      val project = doc.getAs[Project]("project").get
      RepositoryImpl(Option[String](id),
                    name,
                    `type`,
                    Option[List[WebPageElement]](rows),
                    Option[Project](project))
    }
  }
}