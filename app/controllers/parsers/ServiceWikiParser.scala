package controllers.parsers

import play.api.libs.functional.syntax._
import play.api.libs.json._
import reactivemongo.bson.{BSONDocument, BSONDocumentReader, BSONDocumentWriter}
import scala.util.parsing.combinator.RegexParsers
import scala.util.parsing.input.CharArrayReader

/**
 * Created by Sallah Kokaina on 20/11/2014.
 */

/*
|| setup || entity ||
| name | class name | search by |
| country | fr.gefco.tli.psc.ref.model.ICountry | country code |
| state | fr.gefco.tli.psc.ref.model.IState | id |
| zip | fr.gefco.tli.psc.ref.model.IZip | id |
*/

/**
 * Created by Sallah Kokaina on 20/11/2014.
 */

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


class EntityWikiRegexParser extends RegexParsers {
  val h = "|| setup || entity ||"
  def endLine: Parser[String] = """\|""".r
  def str: Parser[String] = """([\w#.:\->=?!+\s\d\[\]\*\'\"])+""".r
  def header: Parser[String] = "| name | class name | search by |"
  def line: Parser[EntityField] = "|" ~ str ~ "|" ~ str ~ "|" ~ str ~ "|" ^^ {
    case sp0 ~ pName ~ sp1 ~ cType ~ sp2 ~ locator ~ sp3 =>
      EntityField(pName.trim, cType.trim, locator.trim)
  }

  def lines : Parser[List[EntityField]] = h ~> header ~> rep(line)

  def parse(text: String) = List[List[EntityField]] {
    parseAll(lines, new CharArrayReader(text.toCharArray)) match {
      case Success(p, _) => p
      case x => {
        //error case, print x to know what happened, println(x)
        println(x)
        List(EntityField("","",""))
      }
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
          val valid = list.head.contains("setup") && list.head.contains("entity") && list.head.startsWith("||") && list.head.endsWith("||")
          if (valid) acc :: parselines(List("|| setup || entity ||"), list.tail)
          else parselines(acc ++ List(list.head), list.tail)
        }
      }
    }
    val out = parselines(List(), myList.toList)
    source.close()
    out
  }
}



object SetupEntityWikiParserTest extends EntityWikiRegexParser with App {
  val output = getListOfUnparsedPages("D:\\redplay\\redplay\\app\\config.txt")
  val res = (for {item <- output if !item.isEmpty} yield parse(item.mkString("\n"))).map{l => l.head}
  res.map {
    item => item match {
      case List(EntityField("", "", "")) => {}
      case e => {
        println("saving => " + e)
      }
    }
  }
}
