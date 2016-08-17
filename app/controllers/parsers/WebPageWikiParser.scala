package controllers.parsers


import controllers.mongo.project.Project
import play.api.libs.json._
import reactivemongo.bson.{BSONDocumentReader, BSONDocument, BSONDocumentWriter}

import scala.util.{Success, Failure}

import reactivemongo.bson.BSONObjectID



abstract trait Page
case class WebPage(id: Option[String],
                   name: String,
                   cType: String,
                   elements: List[WebPageElement],
                   project: Option[Project]) extends Page
case class WebPageElement(id: Option[String],
                          name: String,
                          elementType: String,
                          locator: String,
                          method: Option[String],
                          position: Option[Int])

object WebPageElement{
  implicit val jsonHandler = Json.format[WebPageElement]

  implicit object WebPageElementReader extends BSONDocumentReader[WebPageElement] {
    def read(doc: BSONDocument): WebPageElement = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val cType = doc.getAs[String]("type").get
      val locator = doc.getAs[String]("locator").get
      val method = doc.getAs[String]("method").getOrElse("")
      val position = doc.getAs[Int]("position").getOrElse(0)
      WebPageElement(Some(id), name, cType, locator, Some(method) ,Some(position))
    }
  }

  implicit object WebPageElementImplicitBSONWriter extends BSONDocumentWriter[WebPageElement] {
    def write(wpe: WebPageElement): BSONDocument = {
      WebPageElementBSONWriter.write(wpe)
    }
  }
}

object WebPageElementBSONWriter extends BSONDocumentWriter[WebPageElement] {

    def formatName(name: String): String = {
      name.trim.replace(" ", "_").replace("'", "_").replace("°", "_")
    }
    def write(wpe: WebPageElement): BSONDocument = {
      wpe.id match {
        case None => BSONDocument(
                "_id" -> BSONObjectID.generate,
                "name"-> formatName(wpe.name),
                "type" -> wpe.elementType,
                "locator" -> wpe.locator,
                "method" -> wpe.method,
                "position" -> wpe.position)
        case value:Option[String] => BSONDocument(
                "_id" -> BSONObjectID(wpe.id.get),
                "name"-> formatName(wpe.name),
                "type" -> wpe.elementType,
                "locator" -> wpe.locator,
                "method" -> wpe.method,
                "position" -> wpe.position)
      }
      
    }
  }


