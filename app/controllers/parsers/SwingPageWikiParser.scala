package controllers.parsers

import controllers.mongo.MongoConnector
import play.api.libs.functional.syntax._
import play.api.libs.json._
import reactivemongo.bson.{BSONDocumentReader, BSONDocument, BSONDocumentWriter}

import scala.util.{Success, Failure}
import scala.util.parsing.combinator._
import scala.util.parsing.input.CharArrayReader

/**
 * Created by Sallah Kokaina on 20/11/2014.
 */

case class SwingPage(name: String, cType: String,  elements: List[SwingPageElement]) extends Page
case class SwingPageElement(name: String, elementType: String, locator: String)

object SwingPageElement{

  implicit val webPageElementJsonReader: Reads[SwingPageElement] = (
      (__ \ "name").read[String] and
      (__ \ "type").read[String] and
      (__ \ "locator").read[String])(SwingPageElement.apply(_,_,_))

  implicit val webPageElementJsonWriter: Writes[SwingPageElement] = (
      (__ \ "name").write[String] and
      (__ \ "type").write[String] and
      (__ \ "locator").write[String]
    )(unlift(SwingPageElement.unapply))

  implicit object SwingPageElementReader extends BSONDocumentReader[SwingPageElement] {
    def read(doc: BSONDocument): SwingPageElement = {
      val name = doc.getAs[String]("name").get
      val cType = doc.getAs[String]("type").get
      val locator = doc.getAs[String]("locator").get
      SwingPageElement(name, cType, locator)
    }
  }

  implicit object SwingPageElementBSONWriter extends BSONDocumentWriter[SwingPageElement] {
    def write(wpe: SwingPageElement): BSONDocument =
      BSONDocument(
        "name"-> wpe.name,
        "type" -> wpe.elementType,
        "locator" -> wpe.locator)
  }
}

object SwingPage{

  /*implicit object WebPageReader extends BSONDocumentReader[WebPageElement] {
    def read(doc: BSONDocument): WebPageElement = {
      val name = doc.getAs[String]("name").get
      val cType = doc.getAs[String]("type").get
      val rows = doc.getAs[List[WebPageElement]]("rows").get
      WebPageElement(name, cType, rows)
    }
  }*/

  implicit object SwingPageBSONWriter extends BSONDocumentWriter[SwingPage] {
    def write(configuration: SwingPage): BSONDocument =
      BSONDocument(
        "name"-> configuration.name,
        "type" -> configuration.cType,
        "rows" -> configuration.elements)
  }
}

class SwingPageWikiParser extends RegexParsers {
  def endLine: Parser[String] = """\|""".r
  def str: Parser[String] = """([\w#.:\->=?!+\s\d\[\]\*\'\"])+""".r
  def pageNameBegin: Parser[String] = """\| swing page \|""".r
  def pageName: Parser[String] = "|| auto setup ||" ~> pageNameBegin ~> str <~ endLine
  def header: Parser[String] = "| name | type | locator |"
  def line: Parser[SwingPageElement] = "|" ~ str ~ "|" ~ str ~ "|" ~ str ~ "|" ^^ {
    case sp0 ~ pName ~ sp1 ~ cType ~ sp2 ~ locator ~ sp3 =>
      SwingPageElement(pName.trim, cType.trim, locator.trim)
  }
  def lines = line *
  def page: Parser[SwingPage] = pageName ~ header ~ lines ^^ {
    case pageName ~ header ~ lines => SwingPage(pageName.trim, "swing page" , lines)
  }

  def parse(text: String) = List[SwingPage] {
    parseAll(page, new CharArrayReader(text.toCharArray)) match {
      case Success(p, _) => p
      case _ => SwingPage("", "", List())
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

object SwingPageWikiParserTest extends SwingPageWikiParser with App {
  val output = getListOf("D:\\redplay\\redplay\\app\\web_repository_config.txt")
  val res = (for {item <- output} yield parse(item.mkString("\n"))).map{l => l.head}
  res.map {
    item => item match {
      case SwingPage(_, _,List()) => {}
      case page => {
        println("saving => " + page)

        import scala.concurrent.ExecutionContext.Implicits.global
        /*MongoConnector().getRepositoryCollection.save(page).onComplete {
          case scala.util.Failure(e) => throw e
          case scala.util.Success(_) => println("successfully saved !")
        }*/

      }
    }
  }
}