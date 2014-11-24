package controllers.mongo

import controllers.parsers.WebPageElement
import play.api.libs.functional.syntax._
import play.api.libs.json._
import play.api.libs.json.Writes._
import play.api.libs.json.Reads._
import reactivemongo.bson.BSONDocumentReader
import reactivemongo.bson.BSONDocument
import reactivemongo.bson.BSONDocumentWriter
import reactivemongo.bson.BSONObjectID

case class ConfigurationSyntax(sentence: String, typed_sentence: String)
case class ConfigurationRow(group: String, name: String, syntax: List[ConfigurationSyntax])
case class Configuration(id: Option[String], cType: String, rows: List[ConfigurationRow])

case class AutoSetupConfig(id: Option[String], name: String, cType: String, rows: List[WebPageElement])

object AutoSetupConfig{
    implicit val autoSetupConfigReader: Reads[AutoSetupConfig]= (
      (__ \ "id").readNullable[String] and
      (__ \ "name").read[String] and
      (__ \ "type").read[String] and
      (__ \ "rows").read[List[WebPageElement]])(AutoSetupConfig.apply(_,_ , _,_)
    )

    implicit val autoSetupConfigWriter: Writes[AutoSetupConfig] = (
    (__ \ "id").writeNullable[String] and  
    (__ \ "name").write[String] and
    (__ \ "type").write[String] and
    (__ \ "rows").write[List[WebPageElement]])(unlift(AutoSetupConfig.unapply))
  
  implicit object AutoSetupConfigurationWriter extends BSONDocumentWriter[AutoSetupConfig] {
    def write(configuration: AutoSetupConfig): BSONDocument = 
      configuration.id match {
      	case None =>  BSONDocument("name"-> configuration.name, "type" -> configuration.cType,  "rows" -> configuration.rows)
      	case  value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get), "name"-> configuration.name,  "type" -> configuration.cType,  "rows" -> configuration.rows)
      }
  }

  implicit object AutoSetupConfigurationReader extends BSONDocumentReader[AutoSetupConfig] {
    def read(doc: BSONDocument): AutoSetupConfig = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val ctype = doc.getAs[String]("type").get
      val rows = doc.getAs[List[WebPageElement]]("rows").get
      AutoSetupConfig(Option[String](id), name, ctype, rows)
    }
  }
}

object ConfigurationSyntax {

  implicit val configSyntaxReader: Reads[ConfigurationSyntax] = (
    (__ \ "sentence").read[String]
    and (__ \ "typed_sentence").read[String])(ConfigurationSyntax.apply(_,_))

  implicit val configSyntaxWriter: Writes[ConfigurationSyntax] = (
    (__ \ "sentence").write[String] and
    (__ \ "typed_sentence").write[String])(unlift(ConfigurationSyntax.unapply))

  implicit object ConfigurationSyntaxReader extends BSONDocumentReader[ConfigurationSyntax] {
    def read(doc: BSONDocument): ConfigurationSyntax = {
      val sentence = doc.getAs[String]("sentence").get
      val typed_sentence = doc.getAs[String]("typed_sentence").get
      ConfigurationSyntax(sentence, typed_sentence)
    }
  }

  implicit object ConfigurationSyntaxWriter extends BSONDocumentWriter[ConfigurationSyntax] {
    def write(configurationSyntax: ConfigurationSyntax): BSONDocument = BSONDocument(
      "sentence" -> configurationSyntax.sentence,
      "typed_sentence" -> configurationSyntax.typed_sentence)
  }

}

object ConfigurationRow {

  implicit val configRowReader: Reads[ConfigurationRow] = (
    (__ \ "type").read[String] and
    (__ \ "name").read[String] and 
    (__ \ "syntax").read[List[ConfigurationSyntax]])(ConfigurationRow.apply(_,_,_))

  implicit val configRowWriter: Writes[ConfigurationRow] = (
    (__ \ "type").write[String] and
    (__ \ "name").write[String] and
    (__ \ "syntax").write[List[ConfigurationSyntax]])(unlift(ConfigurationRow.unapply))

  implicit object ConfigurationRowWriter extends BSONDocumentWriter[ConfigurationRow] {
    def write(configurationRow: ConfigurationRow): BSONDocument = BSONDocument(
      "type" -> configurationRow.group,
      "name" -> configurationRow.name,
      "syntax" -> configurationRow.syntax)
  }

  implicit object ConfigurationRowReader extends BSONDocumentReader[ConfigurationRow] {
    def read(doc: BSONDocument): ConfigurationRow = {
      val group = doc.getAs[String]("type").get
      val name = doc.getAs[String]("name").get
      val syntax = doc.getAs[List[ConfigurationSyntax]]("syntax").get
      ConfigurationRow(group, name, syntax)
    }
  }

}

object Configuration {

  implicit val configReader: Reads[Configuration] = (
    (__ \ "id").readNullable[String] and  
    (__ \ "type").read[String]
    and (__ \ "rows").read[List[ConfigurationRow]])(Configuration.apply(_, _, _))

  implicit val configWriter: Writes[Configuration] = (
    (__ \ "id").writeNullable[String] and  
    (__ \ "type").write[String] and
    (__ \ "rows").write[List[ConfigurationRow]])(unlift(Configuration.unapply))

  implicit object ConfigurationWriter extends BSONDocumentWriter[Configuration] {
    def write(configuration: Configuration): BSONDocument = 
      configuration.id match {
      	case None =>  BSONDocument("type" -> configuration.cType, "rows" -> configuration.rows)
      	case  value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get), "type" -> configuration.cType, "rows" -> configuration.rows)
      }
  }

  implicit object ConfigurationReader extends BSONDocumentReader[Configuration] {
    def read(doc: BSONDocument): Configuration = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val ctype = doc.getAs[String]("type").get
      val rows = doc.getAs[List[ConfigurationRow]]("rows").get
      Configuration(Option[String](id), ctype, rows)
    }
  }
}

