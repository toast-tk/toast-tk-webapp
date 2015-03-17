package controllers.parsers


import controllers.mongo.MongoConnector
import play.api.libs.functional.syntax._
import play.api.libs.json._
import reactivemongo.bson.{BSONDocumentReader, BSONDocument, BSONDocumentWriter}

import scala.util.{Success, Failure}
import scala.util.parsing.combinator._
import scala.util.parsing.input.CharArrayReader

import reactivemongo.bson.BSONObjectID

/**
 * Created by Sallah Kokaina on 20/11/2014.
 */

abstract trait Page
case class WebPage(id: Option[String], name: String, cType: String,  elements: List[WebPageElement]) extends Page
case class WebPageElement(id: Option[String], name: String, elementType: String, locator: String, method: Option[String], position: Option[Int])

object WebPageElement{

  implicit val webPageElementJsonReader: Reads[WebPageElement] = (
      (__ \ "id").readNullable[String] and
      (__ \ "name").read[String] and
      (__ \ "type").read[String] and
      (__ \ "locator").read[String] and
      (__ \ "method").readNullable[String] and
      (__ \ "position").readNullable[Int])(WebPageElement.apply(_,_,_,_,_,_))

  implicit val webPageElementJsonWriter: Writes[WebPageElement] = (
      (__ \ "id").writeNullable[String] and
      (__ \ "name").write[String] and
      (__ \ "type").write[String] and
      (__ \ "locator").write[String] and
      (__ \ "method").writeNullable[String] and
      (__ \ "position").writeNullable[Int]
    )(unlift(WebPageElement.unapply))

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

object WebPage{

  implicit object WebPageBSONWriter extends BSONDocumentWriter[WebPage] {
    def write(configuration: WebPage): BSONDocument = {

      configuration.id match {
        case None =>  BSONDocument("name"-> configuration.name,
                      "type" -> configuration.cType,
                      "rows" -> configuration.elements)
        case value:Option[String] => BSONDocument(
                      "_id" -> BSONObjectID(configuration.id.get),
                      "name"-> configuration.name,
                      "type" -> configuration.cType,
                      "rows" -> configuration.elements)
      }
    }     
  }
}

class WebPageWikiParser extends RegexParsers {
  def endLine: Parser[String] = """\|""".r
  def str: Parser[String] = """([\w#.:\->=?!+\s\d\[\]\*\'\"])+""".r
  def pageNameBegin: Parser[String] = """\| web page \|""".r
  def pageName: Parser[String] = "|| auto setup ||" ~> pageNameBegin ~> str <~ endLine
  def header: Parser[String] = "| name | type | locator | method | position |"
  def line: Parser[WebPageElement] = "|" ~ str ~ "|" ~ str ~ "|" ~ str ~ "|" ~ str ~ "|" ~ str ~ "|" ^^ {
    case sp0 ~ pName ~ sp1 ~ cType ~ sp2 ~ locator ~ sp3 ~ method ~ sp4 ~ position ~ sp5 =>
      WebPageElement(None, pName.trim, cType.trim, locator.trim, Some(method.trim), Some(position.trim.toInt))
  }
  def lines = line *
  def page: Parser[WebPage] = pageName ~ header ~ lines ^^ {
    case pageName ~ header ~ lines => WebPage(None, pageName.trim, "web page" , lines)
  }

  def parse(text: String) = List[WebPage] {
    parseAll(page, new CharArrayReader(text.toCharArray)) match {
      case Success(p, _) => p
      case _ => WebPage(None, "", "", List())
      /*case x => {
        //error case, print x to know what happened, println(x)
        println(x)
      }*/
    }
  }

  def getListOf(path: String) = {
    import scala.io.Source
    val source = Source.fromFile(path)
    val myList = source.getLines().filter(line => line.startsWith("|"))
    def parselines(acc: List[String], src: List[String]): List[List[String]] = {
      src match {
        case Nil => List(acc)
        case list: List[String] => {
          if (list.head.startsWith("|| auto setup ||")) acc :: parselines(List("|| auto setup ||"), list.tail)
          else parselines(acc ++ List(list.head), list.tail)
        }
      }
    }
    val out = parselines(List(), myList.toList)
    source.close()
    out
  }
}

object WebPageWikiParserTest extends WebPageWikiParser with App {
  val output = getListOf("D:\\redplay\\redplay\\app\\web_repository_config.txt")
  val res = (for {item <- output} yield parse(item.mkString("\n"))).map{l => l.head}
  res.map {
    item => item match {
      case WebPage(_,_, _,List()) => {}
      case page => {
        println("saving => " + page)

        import scala.concurrent.ExecutionContext.Implicits.global
        MongoConnector().getRepositoryCollection.save(page).onComplete {
          case scala.util.Failure(e) => throw e
          case scala.util.Success(_) => println("successfully saved !")
        }
      }
    }
  }
}