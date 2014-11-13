package controllers

import controllers.mongo.Configuration
import controllers.mongo.ConfigurationRow
import controllers.mongo.ConfigurationSyntax
import controllers.mongo.MongoConnector
import play.api._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.functional.syntax._
import play.api.libs.json._
import play.api.libs.json.Reads._
import play.api.libs.json.Writes._
import play.api.mvc._
import controllers.mongo.AutoSetupConfig

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
    setupType match {
      case "web page" => Ok(
        Json.obj(
          "columns" -> Json.arr(Json.obj("name"->"name", "descriptor" -> Json.obj()), 
        		  				Json.obj("name"->"type","descriptor" -> Json.obj("type" -> Json.arr("button", "link"))), 
        		  				Json.obj("name"-> "locator", "descriptor" -> Json.obj()), 
        		  				Json.obj("name"-> "method", "descriptor" -> Json.obj("type" -> Json.arr("CSS", "XPATH", "ID"))),
        		  				Json.obj("name"-> "position", "descriptor" -> Json.obj())))
    	);
      case "configure entity" => Ok(
        Json.obj(
          "columns" -> Json.arr(Json.obj("name"->"entity", "descriptor" -> Json.obj()), 
        		  				Json.obj("name"->"alias", "descriptor" -> Json.obj()), 
        		  				Json.obj("name"->"search by", "descriptor" -> Json.obj())))
		  );
      case _ => Ok(Json.obj());
    }
  }
  
  /**
   * scenario service type (backend, web, ..)
   *
   */
  def loadScenarioCtx(scenarioType: String) = Action {
    scenarioType match {
      case "web" => Ok(
    		  Json.obj("columns" -> Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false), 
    				  						 Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
    				  )
      );
      
      case _ => Ok(Json.obj());
    }
  }

  /**
   *   Save Meta config
   */
  def saveConfiguration() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[Configuration]].map {
      case configs: Seq[Configuration] =>
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
   * load to init configuration
   */
  def loadAutoConfiguration() = Action.async {
    MongoConnector.loadAutoConfiguration.map{
      repository => Ok(Json.toJson(repository))
    }
  }
  
  /**
   * get all possible pattern sentences for a given scenario type
   */
  def loadCtxSentences(confType:String, context:String) = Action.async{
    MongoConnector.loadConfigurationSentences(confType, context).map{
      configurations =>{
    	  val res = configurations.filterNot(conf => {
          conf.rows.filterNot(row => row.group.equals(confType) && row.name.equals(context)).length > 0
        })
        /*var res = List[ConfigurationSyntax]();
    	  for(configuration <- configurations){
    		  for(row <- configuration.rows){
    		    if(row.group.equals(confType) && row.name.equals(context)) {
    		      res = res ++ row.syntax
    		    }
    		  } 
    	  }*/
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
              val rows = Json.parse(page.rows);
              val names = (rows \\ "name")
              res = res ++ (names.map{ name => JsString(page.name + "." + name)});
            }
          } 
          Ok(Json.toJson(res));
        }
      }
    }
  }

}