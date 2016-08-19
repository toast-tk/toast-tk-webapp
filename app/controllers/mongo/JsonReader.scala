package controllers.mongo

import controllers.mongo.project.Project
import controllers.mongo.scenario.Scenario
import controllers.parsers.EntityField
import play.api.libs.json._
import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.bson._

import scala.concurrent.{ExecutionContext, Promise, Future}
import scala.util.{Success, Failure}


abstract class Identifiable {
  def _id : Option[BSONObjectID]
}

abstract class IdentifiableCollection[T<:Identifiable](collection: BSONCollection){

  def save(identifiable: T)(implicit writer: BSONDocumentWriter[T], ex: ExecutionContext): Future[T] = {
    val p = Promise[T]
    collection.update(BSONDocument("_id" -> identifiable._id), identifiable, upsert = true).onComplete {
      case Failure(e) => {
        throw e
      }
      case Success(_) => {
        p.success(identifiable)
      }
    }
    p.future
  }

  def list()(implicit writer: BSONDocumentReader[T], ex: ExecutionContext) : Future[List[T]] ={
    val query = BSONDocument()
    val results = collection.find(query).cursor[T]().collect[List]()
    results
  }

  //TODO: add error mngmt
  def one(id: String)(implicit writer: BSONDocumentReader[T], ex: ExecutionContext):Future[Option[T]] = {
    val query = BSONDocument("_id" -> BSONObjectID(id))
    val result = collection.find(query).one[T]
    result
  }

}

case class ConfigurationSyntax(sentence: String, typed_sentence: String, description: String)
case class ConfigurationRow(group: String, name: String, syntax: List[ConfigurationSyntax])
case class MacroConfiguration(id: Option[String], cType: String, rows: List[ConfigurationRow])

case class ServiceEntityConfig(id: Option[String], name: String, cType: String, rows: Option[List[EntityField]])
case class ServiceEntityConfigWithRefs(id: Option[String], name: String, cType: String, rows: Option[List[DBRef]])
case class AutoSetupConfigWithRefs(id: Option[String],
                                   name: String,
                                   cType: String,
                                   rows: Option[List[DBRef]],
                                   project: Option[Project])

case class InspectedPage(name: String, items: List[String])
case class InspectedScenario(name: String, steps: String)

case class TestScript(id: Option[String], name: String, scenarii: List[Scenario])

case class ScenarioRows(patterns: String, kind: Option[String], mappings: Option[List[ScenarioRowMapping]])
case class ScenarioRowMapping(id: String, value: String, pos: Int)

case class DBRef(collection: String, id: BSONObjectID, db: Option[String] = None)

case class FixtureDescriptorLine(name: String, fixtureType: String, pattern: String, description: String)
case class MojoFixtureDescriptor(name: String, sentences: List[FixtureDescriptorLine])

case class MappedWebEventRecord (
                                  component: Option[String],
                                  eventType: Option[String],
                                  target: Option[String],
                                  keyCode: Option[Int],
                                  charCode: Option[Int],
                                  button: Option[Int],
                                  altKey: Option[Boolean],
                                  ctrlKey: Option[Boolean],
                                  shiftKey: Option[Boolean],
                                  id: Option[String],
                                  value: Option[String],
                                  componentName: Option[String],
                                  parent: Option[String],
                                  path: Option[String]
                            )
object DBRef {
  implicit object DBRefReader extends BSONDocumentReader[DBRef] {
    def read(bson: BSONDocument) =
      DBRef(
        bson.getAs[String]("$ref").get,
        bson.getAs[BSONObjectID]("$id").get,
        bson.getAs[String]("$db"))
  }

  implicit object DBRefWriter extends BSONDocumentWriter[DBRef] {
    def write(ref: DBRef) =
      BSONDocument(
        "$ref" -> ref.collection,
        "$id" -> ref.id,
        "$db" -> ref.db)
  }
}

object FixtureDescriptorLine {
  implicit val format = Json.format[FixtureDescriptorLine]
}

object MojoFixtureDescriptor {
  implicit val format = Json.format[MojoFixtureDescriptor]
}



object ScenarioRowMapping{
  implicit val format = Json.format[ScenarioRowMapping]
}

object ScenarioRows{
  implicit val format = Json.format[ScenarioRows]
}

object InspectedScenario{
  implicit val format = Json.format[InspectedScenario]
}

object InspectedPage{
  implicit val format = Json.format[InspectedPage]
}

object TestScript{
  implicit val format = Json.format[TestScript]
  implicit object BSONWriter extends BSONDocumentWriter[TestScript] {
    def write(testScript: TestScript): BSONDocument =
      testScript.id match {
        case None =>  BSONDocument("name"-> testScript.name, "scenarii" -> testScript.scenarii)
        case value:Option[String] => BSONDocument(
          "_id" -> BSONObjectID(value.get), 
          "name"-> testScript.name,
          "scenarii" -> testScript.scenarii)
      }
  }
  implicit object BSONReader extends BSONDocumentReader[TestScript] {
    def read(doc: BSONDocument): TestScript = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val scenarii = doc.getAs[List[Scenario]]("scenarii").get
      TestScript(Option[String](id), name ,scenarii)
    }
  }
}

object AutoSetupConfigWithRefs{

  implicit object AutoSetupConfigurationWriter extends BSONDocumentWriter[AutoSetupConfigWithRefs] {
    def write(configuration: AutoSetupConfigWithRefs): BSONDocument = 
      configuration.id match {
        case None => BSONDocument("name"-> configuration.name, "type" -> configuration.cType,
          "rows" -> configuration.rows.getOrElse(List()),
          "project" -> configuration.project.get)
        case value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get), "name"-> configuration.name,
          "type" -> configuration.cType, "rows" -> configuration.rows.getOrElse(List()),
          "project" -> configuration.project.get)
      }
  }

  implicit object AutoSetupConfigurationReader extends BSONDocumentReader[AutoSetupConfigWithRefs] {
    def read(doc: BSONDocument): AutoSetupConfigWithRefs = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val ctype = doc.getAs[String]("type").get
      val rows = doc.getAs[List[DBRef]]("rows").getOrElse(List())
      val project = doc.getAs[Project]("project").get
      AutoSetupConfigWithRefs(Option[String](id), name, ctype, Option[List[DBRef]](rows),
        Option[Project](project))
    }
  }
}


object ConfigurationSyntax {

  implicit val format = Json.format[ConfigurationSyntax]

  implicit object ConfigurationSyntaxReader extends BSONDocumentReader[ConfigurationSyntax] {
    def read(doc: BSONDocument): ConfigurationSyntax = {
      val sentence = doc.getAs[String]("sentence").get
      val typed_sentence = doc.getAs[String]("typed_sentence").get
      val description = doc.getAs[String]("description").get
      ConfigurationSyntax(sentence, typed_sentence, description)
    }
  }

  implicit object ConfigurationSyntaxWriter extends BSONDocumentWriter[ConfigurationSyntax] {
    def write(configurationSyntax: ConfigurationSyntax): BSONDocument = BSONDocument(
      "sentence" -> configurationSyntax.sentence,
      "typed_sentence" -> configurationSyntax.typed_sentence,
      "description" -> configurationSyntax.description)
  }

}

object ConfigurationRow {

  implicit val format = Json.format[ConfigurationRow]

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

object MacroConfiguration {

  implicit val format = Json.format[MacroConfiguration]

  implicit object ConfigurationWriter extends BSONDocumentWriter[MacroConfiguration] {
    def write(configuration: MacroConfiguration): BSONDocument = 
      configuration.id match {
        case None =>  BSONDocument("type" -> configuration.cType, "rows" -> configuration.rows)
        case  value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get), "type" -> configuration.cType, "rows" -> configuration.rows)
      }
  }

  implicit object ConfigurationReader extends BSONDocumentReader[MacroConfiguration] {
    def read(doc: BSONDocument): MacroConfiguration = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val ctype = doc.getAs[String]("type").get
      val rows = doc.getAs[List[ConfigurationRow]]("rows").get
      MacroConfiguration(Option[String](id), ctype, rows)
    }
  }
}
