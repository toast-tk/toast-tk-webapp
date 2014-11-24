package controllers.parsers

import controllers.mongo.MongoConnector
import play.api.libs.functional.syntax._
import play.api.libs.json._
import reactivemongo.bson.{BSONDocumentWriter, BSONDocument, BSONDocumentReader}

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
case class AutoSetupEntityField(name: String, alias: String)
case class AutoSetupEntity(name: String, cType: String,  fields: List[AutoSetupEntityField])


object AutoSetupEntityField{

  implicit val entityFieldJsonReader: Reads[AutoSetupEntityField] = (
    (__ \ "name").read[String] and
      (__ \ "alias").read[String])(AutoSetupEntityField.apply(_,_))

  implicit val entityFieldJsonWriter: Writes[AutoSetupEntityField] = (
    (__ \ "name").write[String] and
      (__ \ "alias").write[String]
    )(unlift(AutoSetupEntityField.unapply))

  implicit object EntityFieldReader extends BSONDocumentReader[AutoSetupEntityField] {
    def read(doc: BSONDocument): AutoSetupEntityField = {
      val name = doc.getAs[String]("name").get
      val alias = doc.getAs[String]("alias").get
      AutoSetupEntityField(name, alias)
    }
  }

  implicit object AutoSetupEntityFieldBSONWriter extends BSONDocumentWriter[AutoSetupEntityField] {
    def write(wpe: AutoSetupEntityField): BSONDocument =
      BSONDocument(
        "name"-> wpe.name,
        "alias" -> wpe.alias)
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

  implicit object EntityBSONWriter extends BSONDocumentWriter[AutoSetupEntity] {
    def write(configuration: AutoSetupEntity): BSONDocument =
      BSONDocument(
        "name"-> configuration.name,
        "type" -> configuration.cType,
        "rows" -> configuration.fields)
  }
}

class EntityAutoSetupWikiParser extends RegexParsers {
  val startTag = "||auto setup||" | "|| auto setup ||"
  val titlePrefix = """\|(\s*)(configure entity)(\s*)\|"""
  val tableHeader = """.*greenpepper name.*"""
  val configType = "configure entity"

  def endLine: Parser[String] = """\|""".r
  def str: Parser[String] = """([\w#.:\->=?!+\s\d\[\]\*\'\"])+""".r
  def pageNameBegin: Parser[String] = titlePrefix.r
  def entityName: Parser[String] = startTag ~> pageNameBegin ~> str <~ endLine
  def header: Parser[String] = tableHeader.r
  def regLine: Parser[AutoSetupEntityField] = ("|" ~ str ~ "|" ~ str ~ "|") ^^ {
    case sp0 ~ pName ~ sp1 ~ alias ~ sp2 => AutoSetupEntityField(pName.trim, alias.trim)
  }
  def line: Parser[AutoSetupEntityField] = ("|" ~ str ~ "|" ~ str ~ "|" ~ str ~ "|") ^^ {
    case sp0 ~ pName ~ sp1 ~ alias ~ sp2 ~ otherValue ~ sp3 => AutoSetupEntityField(pName.trim, otherValue.trim)
  }
  def lines = (line | regLine)*
  def entity: Parser[AutoSetupEntity] = entityName ~ header ~ lines ^^ {
    case entityName ~ header ~ lines => AutoSetupEntity(entityName.trim, configType , lines)
  }

  def parse(text: String) = List[AutoSetupEntity] {
    parseAll(entity, new CharArrayReader(text.toCharArray)) match {
      case Success(e, _) => e
      case x => {
        //error case, print x to know what happened, println(x)
        println(x)
        AutoSetupEntity("", "", List())
      }
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
          val valid = list.head.contains("auto setup") && list.head.startsWith("||") && list.head.endsWith("||")
          if (valid) acc :: parselines(List("|| auto setup ||"), list.tail)
          else parselines(acc ++ List(list.head), list.tail)
        }
      }
    }
    val out = parselines(List(), myList.toList)
    source.close()
    out
  }
}


object AutoSetupEntityWikiParserTest extends EntityAutoSetupWikiParser with App {
  val output = getListOf("D:\\redplay\\redplay\\app\\config.txt")
  val res = (for {item <- output if !item.isEmpty} yield parse(item.mkString("\n"))).map{l => l.head}
  res.map {
    item => item match {
      case AutoSetupEntity(_, _, List()) => {}
      case e => {
        println("saving => " + e)
      }
    }
  }
}

