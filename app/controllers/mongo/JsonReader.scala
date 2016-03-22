package controllers.mongo

import controllers.parsers.WebPageElement
import controllers.parsers.EntityField
import play.api.libs.functional.syntax._
import play.api.libs.json._
import play.api.libs.json.Writes._
import play.api.libs.json.Reads._
import reactivemongo.bson.BSONDocumentReader
import reactivemongo.bson.BSONDocument
import reactivemongo.bson.BSONDocumentWriter
import reactivemongo.bson.BSONObjectID


case class ConfigurationSyntax(sentence: String, typed_sentence: String, description: String)
case class ConfigurationRow(group: String, name: String, syntax: List[ConfigurationSyntax])
case class MacroConfiguration(id: Option[String], cType: String, rows: List[ConfigurationRow])
case class ServiceEntityConfig(id: Option[String], name: String, cType: String, rows: Option[List[EntityField]])
case class ServiceEntityConfigWithRefs(id: Option[String], name: String, cType: String, rows: Option[List[DBRef]])
case class AutoSetupConfig(id: Option[String], name: String, cType: String, rows: Option[List[WebPageElement]])
case class AutoSetupConfigWithRefs(id: Option[String], name: String, cType: String, rows: Option[List[DBRef]])
case class InspectedPage(name: String, items: List[String])
case class InspectedScenario(name: String, steps: String)
case class Scenario(id: Option[String], name: String, cType: String, driver: String, rows: Option[String], parent: Option[String])
case class TestScript(id: Option[String], name: String, scenarii: List[Scenario])
case class ScenarioRows(patterns: String, kind: Option[String], mappings: Option[List[ScenarioRowMapping]])
case class ScenarioRowMapping(id: String, value: String, pos: Int)
case class DBRef(collection: String, id: BSONObjectID, db: Option[String] = None)
case class FixtureDescriptorLine(name: String, fixtureType: String, pattern: String, description: String)
case class MojoFixtureDescriptor(name: String, sentences: List[FixtureDescriptorLine])
case class InspectedUser(login: String, password: String)
case class User(id: Option[String], login: String, password: String, firstName: String, lastName: String, email: String, teams:  Option[String], token : Option[String], isActive : Boolean, lastConnection : Option[String])

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

object MojoFixtureDescriptor {
  implicit val reader: Reads[MojoFixtureDescriptor]= (
      (__ \ "name").read[String] and
      (__ \ "sentences").read[List[FixtureDescriptorLine]])(MojoFixtureDescriptor.apply(_,_))

  implicit val writer: Writes[MojoFixtureDescriptor] = (
      (__ \ "name").write[String] and
      (__ \ "sentences").write[List[FixtureDescriptorLine]])(unlift(MojoFixtureDescriptor.unapply))
}

object FixtureDescriptorLine {
  implicit val reader: Reads[FixtureDescriptorLine]= (
      (__ \ "name").read[String] and
      (__ \ "fixtureType").read[String] and
      (__ \ "pattern").read[String] and
      (__ \ "description").read[String])(FixtureDescriptorLine.apply(_,_,_,_))

  implicit val writer: Writes[FixtureDescriptorLine] = (
      (__ \ "name").write[String] and
      (__ \ "fixtureType").write[String] and
      (__ \ "pattern").write[String] and
      (__ \ "description").write[String])(unlift(FixtureDescriptorLine.unapply))
}

object ScenarioRowMapping{
  implicit val reader: Reads[ScenarioRowMapping]= (
      (__ \ "id").read[String] and
      (__ \ "val").read[String] and
      (__ \ "pos").read[Int])(ScenarioRowMapping.apply(_,_,_))

  implicit val writer: Writes[ScenarioRowMapping] = (
      (__ \ "id").write[String] and
      (__ \ "val").write[String] and
      (__ \ "pos").write[Int])(unlift(ScenarioRowMapping.unapply))
}

object ScenarioRows{
  implicit val reader: Reads[ScenarioRows]= (
      (__ \ "patterns").read[String] and
      (__ \ "kind").readNullable[String] and
      (__ \ "mappings").readNullable[List[ScenarioRowMapping]])(ScenarioRows.apply(_,_,_))

  implicit val writer: Writes[ScenarioRows] = (
      (__ \ "patterns").write[String] and
      (__ \ "kind").writeNullable[String] and
      (__ \ "mappings").writeNullable[List[ScenarioRowMapping]])(unlift(ScenarioRows.unapply))
}

object InspectedScenario{
  implicit val reader: Reads[InspectedScenario]= (
      (__ \ "name").read[String] and
      (__ \ "steps").read[String])(InspectedScenario.apply(_,_))

  implicit val writer: Writes[InspectedScenario] = (
      (__ \ "name").write[String] and
      (__ \ "steps").write[String])(unlift(InspectedScenario.unapply))
}

object InspectedPage{
  implicit val reader: Reads[InspectedPage]= (
      (__ \ "name").read[String] and
      (__ \ "items").read[List[String]])(InspectedPage.apply(_,_))

  implicit val writer: Writes[InspectedPage] = (
      (__ \ "type").write[String] and
      (__ \ "items").write[List[String]])(unlift(InspectedPage.unapply))
}

object Scenario{
  implicit val reader: Reads[Scenario]= (
      (__ \ "id").readNullable[String] and
    (__ \ "name").read[String] and
      (__ \ "type").read[String] and
      (__ \ "driver").read[String] and
      (__ \ "rows").readNullable[String] and
      (__ \ "parent").readNullable[String])(Scenario.apply(_,_,_,_,_,_))

  implicit val writer: Writes[Scenario] = (
      (__ \ "id").writeNullable[String] and
      (__ \ "name").write[String] and
      (__ \ "type").write[String] and
      (__ \ "driver").write[String] and
      (__ \ "rows").writeNullable[String] and
      (__ \ "parent").writeNullable[String])(unlift(Scenario.unapply))

  implicit object BSONWriter extends BSONDocumentWriter[Scenario] {
    def write(scenario: Scenario): BSONDocument ={
      val genId = BSONObjectID.generate
      println("genId "+ scenario.id +"--> " + genId.stringify)
      scenario.id match {
        case None =>  BSONDocument("_id" -> genId, "name"-> scenario.name, "type"-> scenario.cType, "driver" -> scenario.driver,  "rows" -> scenario.rows.getOrElse(""), "parent" -> scenario.parent.getOrElse("0"))
        case value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get), 
                                                  "name" -> scenario.name, "type"-> scenario.cType,
                                                  "driver" -> scenario.driver,    
                                                  "rows" -> scenario.rows.getOrElse(""),
                                                  "parent" -> scenario.parent.getOrElse("0")
                                                  )
      }
    }
  }

  implicit object BSONReader extends BSONDocumentReader[Scenario] {
    def read(doc: BSONDocument): Scenario = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val scenarioType = doc.getAs[String]("type").get
      val driver = doc.getAs[String]("driver").get
      val rows = doc.getAs[String]("rows").getOrElse("")
      val parent = doc.getAs[String]("parent").getOrElse("0")
      Scenario(Option[String](id), name ,scenarioType, driver, Option[String](rows), Option[String](parent))
    }
  }
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
        case None => BSONDocument("name"-> configuration.name, "type" -> configuration.cType, "rows" -> configuration.rows.getOrElse(List()))
        case value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get), "name"-> configuration.name, "type" -> configuration.cType, "rows" -> configuration.rows.getOrElse(List()))
      }
  }

  implicit object AutoSetupConfigurationReader extends BSONDocumentReader[AutoSetupConfigWithRefs] {
    def read(doc: BSONDocument): AutoSetupConfigWithRefs = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val ctype = doc.getAs[String]("type").get
      val rows = doc.getAs[List[DBRef]]("rows").getOrElse(List())
      AutoSetupConfigWithRefs(Option[String](id), name, ctype, Option[List[DBRef]](rows))
    }
  }
}


object  ServiceEntityConfigWithRefs{
    implicit object ServiceEntityConfigurationWriter extends BSONDocumentWriter[ServiceEntityConfigWithRefs] {
    def write(configuration: ServiceEntityConfigWithRefs): BSONDocument = 
      configuration.id match {
        case None => BSONDocument("name"-> configuration.name, "type" -> configuration.cType, "rows" -> configuration.rows.getOrElse(List()))
        case value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get), "name"-> configuration.name, "type" -> configuration.cType, "rows" -> configuration.rows.getOrElse(List()))
      }
  }

  implicit object ServiceEntityConfigurationReader extends BSONDocumentReader[ServiceEntityConfigWithRefs] {
    def read(doc: BSONDocument): ServiceEntityConfigWithRefs = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val ctype = doc.getAs[String]("type").get
      val rows = doc.getAs[List[DBRef]]("rows").getOrElse(List())
      ServiceEntityConfigWithRefs(Option[String](id), name, ctype, Option[List[DBRef]](rows))
    }
  }
}

object ServiceEntityConfig{
    implicit val autoSetupConfigReader: Reads[ServiceEntityConfig]= (
      (__ \ "id").readNullable[String] and
      (__ \ "name").read[String] and
      (__ \ "type").read[String] and
      (__ \ "rows").readNullable[List[EntityField]])(ServiceEntityConfig.apply(_,_ , _,_)
    )

    implicit val autoSetupConfigWriter: Writes[ServiceEntityConfig] = (
    (__ \ "id").writeNullable[String] and
    (__ \ "name").write[String] and
    (__ \ "type").write[String] and
    (__ \ "rows").writeNullable[List[EntityField]])(unlift(ServiceEntityConfig.unapply))

  implicit object ServiceEntityConfigurationWriter extends BSONDocumentWriter[ServiceEntityConfig] {
    def formatName(name: String): String = {
      name.trim.replace(" ", "_").replace("'", "_").replace("°", "_")
    }
    def write(configuration: ServiceEntityConfig): BSONDocument = {
      val formatedName = formatName(configuration.name)
      configuration.id match {
        case None => BSONDocument("name"-> formatedName, "type" -> configuration.cType, "rows" -> configuration.rows.getOrElse(List()))
        case value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get), "name"-> formatedName, "type" -> configuration.cType, "rows" -> configuration.rows.getOrElse(List()))
      }
    }
  }

  implicit object ServiceEntityConfigurationReader extends BSONDocumentReader[ServiceEntityConfig] {
    def read(doc: BSONDocument): ServiceEntityConfig = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val ctype = doc.getAs[String]("type").get
      val rows = doc.getAs[List[EntityField]]("rows").getOrElse(List())
      ServiceEntityConfig(Option[String](id), name, ctype, Option[List[EntityField]](rows))
    }
  }
}

object AutoSetupConfig{
    implicit val autoSetupConfigReader: Reads[AutoSetupConfig]= (
      (__ \ "id").readNullable[String] and
      (__ \ "name").read[String] and
      (__ \ "type").read[String] and
      (__ \ "rows").readNullable[List[WebPageElement]])(AutoSetupConfig.apply(_,_ , _,_)
    )

    implicit val autoSetupConfigWriter: Writes[AutoSetupConfig] = (
    (__ \ "id").writeNullable[String] and
    (__ \ "name").write[String] and
    (__ \ "type").write[String] and
    (__ \ "rows").writeNullable[List[WebPageElement]])(unlift(AutoSetupConfig.unapply))

  implicit object AutoSetupConfigurationWriter extends BSONDocumentWriter[AutoSetupConfig] {
    def formatName(name: String): String = {
      name.trim.replace(" ", "_").replace("'", "_").replace("°", "_")
    }
    def write(configuration: AutoSetupConfig): BSONDocument = {
      val formatedName = formatName(configuration.name)
      configuration.id match {
        case None => BSONDocument("name"-> formatedName, "type" -> configuration.cType, "rows" -> configuration.rows.getOrElse(List()))
        case value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get), "name"-> formatedName, "type" -> configuration.cType, "rows" -> configuration.rows.getOrElse(List()))
      }
    }
  }

  implicit object AutoSetupConfigurationReader extends BSONDocumentReader[AutoSetupConfig] {
    def read(doc: BSONDocument): AutoSetupConfig = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val name = doc.getAs[String]("name").get
      val ctype = doc.getAs[String]("type").get
      val rows = doc.getAs[List[WebPageElement]]("rows").getOrElse(List())
      AutoSetupConfig(Option[String](id), name, ctype, Option[List[WebPageElement]](rows))
    }
  }
}

object ConfigurationSyntax {

  implicit val configSyntaxReader: Reads[ConfigurationSyntax] = (
    (__ \ "sentence").read[String]
    and (__ \ "typed_sentence").read[String]
    and (__ \ "description").read[String])(ConfigurationSyntax.apply(_,_,_))

  implicit val configSyntaxWriter: Writes[ConfigurationSyntax] = (
    (__ \ "sentence").write[String] and
    (__ \ "typed_sentence").write[String] and
    (__ \ "description").write[String])(unlift(ConfigurationSyntax.unapply))

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

object MacroConfiguration {

  implicit val configReader: Reads[MacroConfiguration] = (
    (__ \ "id").readNullable[String] and  
    (__ \ "type").read[String]
    and (__ \ "rows").read[List[ConfigurationRow]])(MacroConfiguration.apply(_, _, _))

  implicit val configWriter: Writes[MacroConfiguration] = (
    (__ \ "id").writeNullable[String] and  
    (__ \ "type").write[String] and
    (__ \ "rows").write[List[ConfigurationRow]])(unlift(MacroConfiguration.unapply))

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

object User{
  implicit val reader: Reads[User]= (
      (__ \ "id").readNullable[String] and
      (__ \ "login").read[String] and
      (__ \ "password").read[String] and
      (__ \ "firstName").read[String] and
      (__ \ "lastName").read[String] and
      (__ \ "email").read[String] and
      (__ \ "teams").readNullable[String] and
      (__ \ "token").readNullable[String] and
      (__ \ "isActive").read[Boolean] and
      (__ \ "lastConnection").readNullable[String])(User.apply(_,_,_,_,_,_,_,_,_,_))

  implicit val writer: Writes[User] = (
      (__ \ "id").writeNullable[String] and
      (__ \ "login").write[String] and
      (__ \ "password").write[String] and
      (__ \ "firstName").write[String] and
      (__ \ "lastName").write[String] and
      (__ \ "email").write[String] and
      (__ \ "teams").writeNullable[String] and
      (__ \ "token").writeNullable[String] and
      (__ \ "isActive").write[Boolean] and
      (__ \ "lastConnection").writeNullable[String])(unlift(User.unapply))

  implicit val userFormat = Json.format[User]
  
  implicit object BSONReader extends BSONDocumentReader[User] {
    def read(doc: BSONDocument): User = {
      val id = doc.getAs[BSONObjectID]("_id").get.stringify
      val login = doc.getAs[String]("login").get
      val password = doc.getAs[String]("password").get
      val firstName = doc.getAs[String]("firstName").get
      val lastName = doc.getAs[String]("lastName").get
      val email = doc.getAs[String]("email").get
      val teams = doc.getAs[String]("teams").getOrElse("")
      val token = doc.getAs[String]("token").getOrElse("")
      val isActive = doc.getAs[Boolean]("isActive").getOrElse(false)
      val lastConnection = doc.getAs[String]("lastConnection").getOrElse("11/11/1111")
      User(Option[String](id), login ,password, firstName, lastName, email, Option[String](teams), Option[String](token), isActive, Option[String](lastConnection))
    }
  }

  implicit object BSONWriter extends BSONDocumentWriter[User] {
    def write(user: User): BSONDocument =
      user.id match {
        case None =>  BSONDocument("login"-> user.login,
                                   "password"-> user.password,
                                   "firstName"-> user.firstName,
                                   "lastName" -> user.lastName,    
                                   "email" -> user.email,
                                   "teams" -> user.teams.getOrElse(""),
                                   "token" -> user.token.getOrElse(""))
        case value:Option[String] => BSONDocument("_id" -> BSONObjectID(value.get),
                                                  "login" -> user.login,
                                                  "password" -> user.password,
                                                  "firstName"-> user.firstName,
                                                  "lastName" -> user.lastName,    
                                                  "email" -> user.email,
                                                  "teams" -> user.teams.getOrElse(""),
                                                  "token" -> user.token.getOrElse(""),
                                                  "isActive" -> user.isActive,
                                                  "lastConnection" -> user.lastConnection.getOrElse("11/11/1111")
                                                  )
      }
  }
}

object InspectedUser{
  implicit val reader: Reads[InspectedUser]= (
    (__ \ "login").read[String] and
    (__ \ "password").read[String])(InspectedUser.apply(_,_))

    implicit val writer: Writes[InspectedUser] = (
      (__ \ "login").write[String] and
      (__ \ "password").write[String])(unlift(InspectedUser.unapply))
    }