package controllers.parsers

import controllers.mongo.MongoConnector
import play.api.libs.functional.syntax._
import play.api.libs.json._
import reactivemongo.bson.{BSONDocumentWriter, BSONDocument, BSONDocumentReader}

import scala.util.parsing.combinator.Parsers.Parser
import scala.util.parsing.combinator.Parsers.Success
import scala.util.parsing.combinator.Parsers.~
import scala.util.parsing.combinator.RegexParsers
import scala.util.parsing.input.CharArrayReader

/**
 * Created by Sallah Kokaina on 20/11/2014.
 */

/*|| setup || entity ||
| name | class name | search by |*/
class EntityWikiParser {

}


/**
 * Created by Sallah Kokaina on 20/11/2014.
 */

case class Entity(name: String, cType: String,  fields: List[EntityField])
case class EntityField(name: String, className: String, searchBy: String)

object EntityField{

  implicit val entityFieldJsonReader: Reads[EntityField] = (
    (__ \ "name").read[String] and
      (__ \ "className").read[String] and
      (__ \ "searchBy").read[String])(EntityField.apply(_,_,_))

  implicit val entityFieldJsonWriter: Writes[EntityField] = (
    (__ \ "name").write[String] and
      (__ \ "className").write[String] and
      (__ \ "searchBy").write[String]
    )(unlift(EntityField.unapply))

  implicit object EntityFieldReader extends BSONDocumentReader[EntityField] {
    def read(doc: BSONDocument): EntityField = {
      val name = doc.getAs[String]("name").get
      val className = doc.getAs[String]("className").get
      val searchBy = doc.getAs[String]("searchBy").get
      EntityField(name, className, searchBy)
    }
  }

  implicit object EntityFieldBSONWriter extends BSONDocumentWriter[EntityField] {
    def write(wpe: EntityField): BSONDocument =
      BSONDocument(
        "name"-> wpe.name,
        "className" -> wpe.className,
        "searchBy" -> wpe.searchBy)
  }
}

object Entity{

  /*implicit object WebPageReader extends BSONDocumentReader[WebPageElement] {
    def read(doc: BSONDocument): WebPageElement = {
      val name = doc.getAs[String]("name").get
      val cType = doc.getAs[String]("type").get
      val rows = doc.getAs[List[WebPageElement]]("rows").get
      WebPageElement(name, cType, rows)
    }
  }*/

  implicit object EntityBSONWriter extends BSONDocumentWriter[Entity] {
    def write(configuration: Entity): BSONDocument =
      BSONDocument(
        "name"-> configuration.name,
        "type" -> configuration.cType,
        "rows" -> configuration.fields)
  }
}

class WebPageWikiParser extends RegexParsers {
  val h = "|| setup || entity ||"
  val c = """|configure entity|"""
  def endLine: Parser[String] = """\|""".r
  def str: Parser[String] = """([\w#.:\->=?!+\s\d\[\]\*\'\"])+""".r
  def pageNameBegin: Parser[String] = c.r
  def pageName: Parser[String] = h ~> pageNameBegin ~> str <~ endLine
  def header: Parser[String] = "| name | type | locator | method | position |"
  def line: Parser[WebPageElement] = "|" ~ str ~ "|" ~ str ~ "|" ~ str ~ "|" ~ str ~ "|" ~ str ~ "|" ^^ {
    case sp0 ~ pName ~ sp1 ~ cType ~ sp2 ~ locator ~ sp3 ~ method ~ sp4 ~ position ~ sp5 =>
      WebPageElement(pName.trim, cType.trim, locator.trim, method.trim, position.trim.toInt)
  }
  def lines = line *
  def page: Parser[WebPage] = pageName ~ header ~ lines ^^ {
    case pageName ~ header ~ lines => WebPage(pageName.trim, "web page" , lines)
  }

  def parse(text: String) = List[WebPage] {
    parseAll(page, new CharArrayReader(text.toCharArray)) match {
      case Success(p, _) => p
      case _ => WebPage("", "", List())
      /*case x => {
        //error case, print x to know what happened, println(x)
        println(x)
      }*/
    }
  }

  def getListOfUnparsedPages(path: String) = {
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
  val output = getListOfUnparsedPages("D:\\redplay\\redplay\\app\\web_repository_config.txt")
  val res = (for {item <- output} yield parse(item.mkString("\n"))).map{l => l.head}
  res.map {
    item => item match {
      case WebPage(_, _,List()) => {}
      case page => {
        println("saving => " + page)

        import scala.concurrent.ExecutionContext.Implicits.global
        MongoConnector.getRepositoryCollection.save(page).onComplete {
          case scala.util.Failure(e) => throw e
          case scala.util.Success(_) => println("successfully saved !")
        }
      }
    }
  }

}

