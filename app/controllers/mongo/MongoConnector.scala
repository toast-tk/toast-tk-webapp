package controllers.mongo
import reactivemongo.api.{MongoDriver, _}
import reactivemongo.bson.BSONDocument
import reactivemongo.bson.Producer.nameValue2Producer
import reactivemongo.api.collections.default.BSONCollection
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.util.{Failure, Success}

object MongoConnector extends App {

  lazy val driver = new MongoDriver()
  lazy val servers = List("localhost")
  val db_name = "play_db";
  val config_collection_name = "configuration";
   
  def open_collection(collection: String) = {  
	val db = driver.connection(servers)("play_db")
    db(collection)
  }

  def getRepositoryCollection: BSONCollection = {
	def play_db_connection = driver.connection(servers)("play_db")
    play_db_connection("repository")
  }

  def saveConfiguration(conf: MacroConfiguration) {
    val collection = open_collection("configuration")
    if(conf.id == null){
	    collection.insert(conf).onComplete {
	      case Failure(e) => throw e
	      case Success(_) => println("successfully inserted configuration !")
	    }
    }else{
    	collection.save(conf).onComplete {
	      case Failure(e) => throw e
	      case Success(_) => println("successfully saved configuration !")
	    }
    }
  }
  
  def saveAutoConfiguration(conf: AutoSetupConfig) {
	val collection = open_collection("repository")
    if(conf.id == null){
	    collection.insert(conf).onComplete {
	      case Failure(e) => throw e
	      case Success(_) => println("successfully inserted configuration !")
	    }
    }else{
    	collection.save(conf).onComplete {
	      case Failure(e) => throw e
	      case Success(_) => println("successfully saved configuration !")
	    }
    }
  }

  def saveScenario(scenario: Scenario) {
    val collection = open_collection("scenarii")
    if(scenario.id == null){
      collection.insert(scenario).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("successfully inserted scanario !")
      }
    }else{
      collection.save(scenario).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("successfully saved scanario !")
      }
    }
  }
  
  def loadConfiguration(): Future[List[MacroConfiguration]] = {
    val collection = open_collection("configuration")
    val query = BSONDocument()
    val configurations = collection.find(query).cursor[MacroConfiguration].collect[List]()
    configurations
  }

  def loadScenarii(): Future[List[Scenario]] = {
    val collection = open_collection("scenarii")
    val query = BSONDocument()
    val scenarii = collection.find(query).cursor[Scenario].collect[List]()
    scenarii
  }
  
   def loadAutoConfiguration(): Future[List[AutoSetupConfig]] = {
     val collection = open_collection("repository")
     val query = BSONDocument()
     val configurations = collection.find(query).cursor[AutoSetupConfig].collect[List]()
     configurations
  }
  
  def loadConfStaticSentences(scenarioType: String, driver: String): Future[List[String]] = {
	 val collection = open_collection("scenarii")
     val query = BSONDocument("type" -> scenarioType, "driver" -> driver)
	 val filter = BSONDocument("_id" -> 0, "rows" -> 1)
	 collection.find(query, filter).cursor[BSONDocument].collect[List]().map{ 
		documents => for(document <- documents) yield document.getAs[String]("rows").get 
	 }
  }
  
  
  def loadWebPagesFromRepository(): Future[List[AutoSetupConfig]] = {
    val collection = open_collection("repository")
    val query = BSONDocument("type" -> "web page");
    val configurations = collection.find(query).cursor[AutoSetupConfig].collect[List]()
    configurations
  }

  def loadSwingPagesFromRepository(): Future[List[AutoSetupConfig]] = {
    val collection = open_collection("repository")
    val query = BSONDocument("type" -> "swing page");
    val configurations = collection.find(query).cursor[AutoSetupConfig].collect[List]()
    configurations
  }
  
  def loadConfigurationSentences(confType:String, context:String): Future[List[MacroConfiguration]] = {
    val collection = open_collection("configuration")
    val query = BSONDocument("type" -> "service", "rows" -> BSONDocument("$elemMatch" -> BSONDocument("type" -> confType, "name" -> context)));
    val configurations = collection.find(query).cursor[MacroConfiguration].collect[List]()
    configurations	  
  }
}

class MongoConnector {

}

