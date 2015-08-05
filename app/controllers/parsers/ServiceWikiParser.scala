package controllers.parsers

import play.api.libs.functional.syntax._
import play.api.libs.json._
import reactivemongo.bson.{BSONDocument, BSONDocumentReader, BSONDocumentWriter}
import scala.util.parsing.combinator.RegexParsers
import scala.util.parsing.input.CharArrayReader

/**
 * Created by Sallah Kokaina on 20/11/2014.
 */

case class ServiceField(name: String, className: String)

object ServiceField{

  implicit val entityFieldJsonReader: Reads[ServiceField] = (
    (__ \ "name").read[String] and
      (__ \ "className").read[String])(ServiceField.apply(_,_))

  implicit val entityFieldJsonWriter: Writes[ServiceField] = (
    (__ \ "name").write[String] and
      (__ \ "className").write[String]
    )(unlift(ServiceField.unapply))

  implicit object ServiceFieldReader extends BSONDocumentReader[ServiceField] {
    def read(doc: BSONDocument): ServiceField = {
      val name = doc.getAs[String]("name").get
      val className = doc.getAs[String]("className").get
      ServiceField(name, className)
    }
  }

  implicit object ServiceFieldBSONWriter extends BSONDocumentWriter[ServiceField] {
    def write(wpe: ServiceField): BSONDocument =
      BSONDocument(
        "name"-> wpe.name,
        "className" -> wpe.className)
  }
}

class ServiceWikiRegexParser extends RegexParsers {
  val h = "|| setup || service ||"
  def endLine: Parser[String] = """\|""".r
  def str: Parser[String] = """([\w#.:\->=?!+\s\d\[\]\*\'\"])+""".r
  def header: Parser[String] = "| name \t\t\t\t            | class \t\t\t\t\t\t\t\t\t\t\t\t\t            |"
  def line: Parser[ServiceField] = "|" ~ str ~ "|" ~ str ~ "|" ^^ {
    case sp0 ~ pName ~ sp1 ~ cType ~ sp2 =>
      ServiceField(pName.trim, cType.trim)
  }

  def lines : Parser[List[ServiceField]] = h ~> header ~> rep(line)

  def parse(text: String) = List[List[ServiceField]] {
    parseAll(lines, new CharArrayReader(text.toCharArray)) match {
      case Success(p, _) => p
      case x => {
        //error case, print x to know what happened, println(x)
        println(x)
        List(ServiceField("",""))
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
          val valid = list.head.contains("setup") && list.head.contains("service") && list.head.startsWith("||") && list.head.endsWith("||")
          if (valid) acc :: parselines(List("|| setup || service ||"), list.tail)
          else parselines(acc ++ List(list.head), list.tail)
        }
      }
    }
    val out = parselines(List(), myList.toList)
    source.close()
    out
  }
}

object SetupServiceWikiParserTest extends ServiceWikiRegexParser with App {
  val output = getListOf("D:\\redplay\\redplay\\app\\config.txt")
  val res = (for {item <- output if !item.isEmpty} yield parse(item.mkString("\n"))).map{l => l.head}
  res.map {
    item => item match {
      case List(ServiceField("", "")) => {}
      case e => {
        println("saving => " + e)
      }
    }
  }
}
