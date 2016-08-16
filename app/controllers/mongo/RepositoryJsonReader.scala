package controllers.mongo

import controllers.parsers.WebPageElement
import play.api.libs.functional.syntax._
import play.api.libs.json._
import reactivemongo.bson.{BSONDocumentReader, BSONObjectID, BSONDocument, BSONDocumentWriter}

case class RepositoryImpl(id: Option[String], name: String, cType: String, rows: Option[List[WebPageElement]])

object RepositoryImpl{
  implicit val repositoryReader: Reads[RepositoryImpl]= (
    (__ \ "id").readNullable[String] and
      (__ \ "name").read[String] and
      (__ \ "type").read[String] and
      (__ \ "rows").readNullable[List[WebPageElement]])(RepositoryImpl.apply(_,_ , _,_)
    )

  implicit val repositoryWriter: Writes[RepositoryImpl] = (
    (__ \ "id").writeNullable[String] and
      (__ \ "name").write[String] and
      (__ \ "type").write[String] and
      (__ \ "rows").writeNullable[List[WebPageElement]])(unlift(RepositoryImpl.unapply))

  implicit object RepositoryWriter extends BSONDocumentWriter[RepositoryImpl] {
    def formatName(name: String): String = {
      name.trim.replace(" ", "_").replace("'", "_").replace("°", "_")
    }
    def write(repository: RepositoryImpl): BSONDocument = {
      val formatedName = formatName(repository.name)
      repository.id match {
        case None =>
          BSONDocument("name"-> formatedName, "type" -> repository.cType, "rows" -> repository.rows.getOrElse(List()))
        case value:Option[String] =>
          BSONDocument("_id" -> BSONObjectID(value.get),
                      "name"-> formatedName,
                      "type" -> repository.cType,
                      "rows" -> repository.rows.getOrElse(List()))
      }
    }
  }

  implicit object RepositoryReader extends BSONDocumentReader[RepositoryImpl] {
    def read(doc: BSONDocument): RepositoryImpl = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val ctype = doc.getAs[String]("type").get
      val rows = doc.getAs[List[WebPageElement]]("rows").getOrElse(List())
      RepositoryImpl(Option[String](id), name, ctype, Option[List[WebPageElement]](rows))
    }
  }
}