package controllers

import controllers.mongo._
import reactivemongo.bson.BSONString
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.json.Reads._
import play.api.libs.json.Writes._
import play.api.libs.json._
import play.api.mvc._
import controllers.parsers.WebPageElement

object Application extends Controller {
  def index = Action {
    Ok(views.html.index())
  }

  def login() = Action(parse.json) { implicit request =>
    //Check credentials and so on...
    Ok(Json.obj("token" -> java.util.UUID.randomUUID().toString))
  }
  
   /**
   * auto setup - run config
   *
   */
  def loadAutoSetupCtx(setupType: String) = Action {
     Ok(autoSetupCtxProvider(setupType))
  }

  def autoSetupCtxProvider(setupType: String): JsArray = {
    setupType match {
      case "web page" => Json.arr(Json.obj("name"->"name", "descriptor" -> Json.obj()),
            Json.obj("name"->"type","descriptor" -> Json.obj("type" -> Json.arr("button", "link"))),
            Json.obj("name"-> "locator", "descriptor" -> Json.obj()),
            Json.obj("name"-> "method", "descriptor" -> Json.obj("type" -> Json.arr("CSS", "XPATH", "ID"))),
            Json.obj("name"-> "position", "descriptor" -> Json.obj()))
      case "swing page" => Json.arr(Json.obj("name"->"name", "descriptor" -> Json.obj()),
            Json.obj("name"->"type","descriptor" -> Json.obj("type" -> Json.arr("button", "link", "input"))),
            Json.obj("name"-> "locator", "descriptor" -> Json.obj()))
      case "configure entity" => Json.arr(Json.obj("name"->"entity", "descriptor" -> Json.obj()),
            Json.obj("name"->"alias", "descriptor" -> Json.obj()),
            Json.obj("name"->"search by", "descriptor" -> Json.obj()))
      case _ => Json.arr();
    }
  }
  
  /**
   * scenario service type (backend, web, ..)
   *
   */
  def loadScenarioCtx(scenarioType: String) = Action {
    Ok(scenarioDescriptorProvider(scenarioType))
  }

  def scenarioDescriptorProvider(scenarioType: String): JsArray = {
    scenarioType match {
      case "web" => Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false),
          Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
      case "swing" =>  Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false),
          Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
      case "backend" => Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false),
          Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
      case _ => Json.arr();
    }
  }

  /**
   *   Save Meta config
   */
  def saveConfiguration() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[MacroConfiguration]].map {
      case configs: Seq[MacroConfiguration] =>
        for {
          conf <- configs
        } yield MongoConnector.saveConfiguration(conf)
        Ok("configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }
  
   /**
   *   Save Auto config
   */
  def saveAutoConfig() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[AutoSetupConfig]].map {
      case configs: Seq[AutoSetupConfig] =>
        for {
          conf <- configs
        } yield MongoConnector.saveAutoConfiguration(conf)
        Ok("auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }
  
  /**
   *   Save new page
   */
  def saveNewInspectedPage() = Action(parse.json) { implicit request =>
    request.body.validate[InspectedPage].map {
      case page: InspectedPage =>
		val pageElements = for(itemLocator <- page.items) yield WebPageElement("", "", itemLocator, "", 0)
		MongoConnector.saveAutoConfiguration(AutoSetupConfig(None, page.name, "swing page", pageElements))
        Ok("received inspected page...")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }
  

  /**
   *   Save scenarii
   */
  def saveScenarii() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[Scenario]].map {
      case scenarii: Seq[Scenario] =>
        for {
          scenario <- scenarii
        } yield MongoConnector.saveScenario(scenario)
        Ok("scenario saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }

  /**
   * load to init configuration
   */
  def loadConfiguration() = Action.async {
      MongoConnector.loadConfiguration.map{
        configurations => {
          Ok(Json.toJson(configurations))
        }
      }
    }

  /**
   * load to init scenarii
   */
  def loadScenarii() = Action.async {
    MongoConnector.loadScenarii.map{
      scenarii => {
        val input = Json.toJson(scenarii).as[JsArray]
        def extendedObject(obj: JsObject) = {
          obj + ("columns" -> scenarioDescriptorProvider((obj \ "type").as[String]))
        }
        val response = for(i <- input.value) yield extendedObject(i.as[JsObject])
        Ok(Json.toJson(response))
      }
    }
  }
 
  
   /**
   * load to wiki scenarii
   * Scenario: (id: Option[String], cType: String, driver: String,rows: String)
	|| scenario || swing ||
	|Type *toto* in *LoginDialog.loginTextField*|
   */
   def loadWikifiedScenarii() = Action.async {
    MongoConnector.loadScenarii.map{
      scenarii => {
		lazy val regex = """@\[\[\d+:[\w\s\.\-]+:[\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+\]\]""".r
		
		def replacePatterns(pattern: String, mapping: List[JsValue]): String = {
			var outputArray = List[String]()
			var mappingPosition = 0
			val splittedPattern = pattern.split("\\s+")
			splittedPattern.foreach{ word => 
				word match {
					case regex() => 
						var replacementWord = "";
						for(jsonMapping <- mapping){
							val pos = (jsonMapping \ "pos").as[Int]
							if(pos.equals(mappingPosition)) replacementWord = (jsonMapping \ "val").as[String]
						}
						outputArray = ("*" + replacementWord + "*") :: outputArray
						mappingPosition = mappingPosition + 1
					case x => outputArray = x :: outputArray
				}
			}
			outputArray.reverse.mkString(" ")
		}
		
		def populatePatterns(rows: String): List[String] = {
			val patterns = Json.parse(rows) \\ "patterns"
			val mappings = Json.parse(rows) \\ "mappings"			
			val modifiedPatterns = for (i <- 0 until patterns.length) yield replacePatterns(patterns(i).as[String], mappings(i).as[List[JsValue]])
			modifiedPatterns.toList
		}
		
		def wikifiedObject(scenario:Scenario): JsValue = {
			var res = "scenario id:" + scenario.id.get + "\n"
			res = res + "scenario driver:" + scenario.driver + "\n"
			res = res + "|| scenario || " + scenario.cType + " ||\n"
			res = res + populatePatterns(scenario.rows).map{ sentence => "| " + sentence + " |\n" }.mkString("") + "\n"
			JsString(res)
		}
        val response = for(scenario <- scenarii) yield wikifiedObject(scenario)
        Ok(Json.toJson(response))
      }
    }
  }
  
  /**
   * load to init configuration
   */
  def loadAutoConfiguration() = Action.async {
    MongoConnector.loadAutoConfiguration.map{
      repository => {
        val input = Json.toJson(repository).as[JsArray]
        def extendedObject(obj: JsObject) = {
          obj + ("columns" -> autoSetupCtxProvider((obj \ "type").as[String]))
        }
        val response = for(i <- input.value) yield extendedObject(i.as[JsObject])
        Ok(Json.toJson(response))
      }
    }
  }
  
     /**
   * load to wiki repository configuration
   * case class AutoSetupConfig(id: Option[String], name: String, cType: String, rows: List[WebPageElement])
   WebPageElement(name: String, elementType: String, locator: String, method: String, position: Int)
   
   */
   def loadWikifiedRepository() = Action.async {
    MongoConnector.loadAutoConfiguration.map{
      repository => {
		def wikifiedObject(page:AutoSetupConfig): JsValue = {
			var res = "page id:" + page.id.get + "\n"
			res = res + "|| auto setup || " + page.name + " ||\n"
			res = res +  "| name | type | locator |\n"
			for(row <- page.rows){
				res = res + "|" + row.name + "|" + row.elementType + "|" + row.locator + "|\n" 
			}
			res = res + "\n"
			JsString(res)
		}
        val response = for(page <- repository) yield wikifiedObject(page)
        Ok(Json.toJson(response))
      }
    }
  }
  
   /**
   * load services json descriptors
   */
  def loadServiceDescriptors(serviceType: String, driverName: String) = Action.async {
	MongoConnector.loadConfStaticSentences(serviceType, driverName).map{
		sentences => {
			val out = for (s <- sentences) yield (Json.parse(s) \\ "patterns")
			val outSentences = out.flatMap{x=>x}	
			Ok(Json.toJson(outSentences))
		}
	}
  }
  
  /**
   * get all possible pattern sentences for a given scenario type
   */
  def loadCtxSentences(confType:String, context:String) = Action.async{
    MongoConnector.loadConfigurationSentences(confType, context).map{
      configurations =>{
        /*val res = configurations.filterNot(conf => {
          conf.rows.filterNot(row => row.group.equals(confType) && row.name.equals(context)).length > 0
        })*/
        var res = List[ConfigurationSyntax]();
        for(configuration <- configurations){
          for(row <- configuration.rows){
            if(row.group.equals(confType) && row.name.equals(context)) {
              res = res ++ row.syntax
            }
          }
        }
    	  Ok(Json.toJson(res))
      } 
    }
    
  }

  /**
   * Get the data to be proposed in a select list for a given context
   * a context = { itemName [WebPageItem, Entity..], other values to refine the result set}
   *
   */
  def loadCtxTagData(itemName: String) = Action.async {
    itemName match {
      case "WebPageItem" => {
        var res = List[JsValue]();
        MongoConnector.loadWebPagesFromRepository().map{
          pageConfigurations => {
            for(page <- pageConfigurations){
              val pageElements = page.rows;
              res = res ++ (pageElements.map{ element => JsString(page.name + "." + element.name)});
            }
          } 
          Ok(Json.toJson(res));
        }
      }
      case "SwingComponent" => {
        var res = List[JsValue]();
        MongoConnector.loadSwingPagesFromRepository().map{
          pageConfigurations => {
            for(page <- pageConfigurations){
              val pageElements = page.rows;
              res = res ++ (pageElements.map{ element => JsString(page.name + "." + element.name)});
            }
          }
            Ok(Json.toJson(res));
        }
      }
    }
  }

  def main (args: Array[String]) {
    MongoConnector.loadAutoConfiguration.map{
      repository => {
        println(repository)
        println(Json.toJson(repository))
      }
    }
  }

}