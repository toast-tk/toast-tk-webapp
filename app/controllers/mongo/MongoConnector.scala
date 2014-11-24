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

  def play_db_connection = driver.connection(servers)("play_db")
  def open_collection(collection: String) = {
    val db = driver.connection(servers)("play_db")
    db(collection)
  }

  def getRepositoryCollection: BSONCollection = {
    play_db_connection("repository")
  }

  def saveConfiguration(conf: Configuration) {
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
  
  def loadConfiguration(): Future[List[Configuration]] = {
    val collection = open_collection("configuration")
    val query = BSONDocument()
    val configurations = collection.find(query).cursor[Configuration].collect[List]()
    configurations
  }
  
   def loadAutoConfiguration(): Future[List[AutoSetupConfig]] = {
     val collection = open_collection("repository")
     val query = BSONDocument()
     val configurations = collection.find(query).cursor[AutoSetupConfig].collect[List]()
     configurations
  }
  
  def loadWebPagesFromRepository(): Future[List[AutoSetupConfig]] = {
    val collection = open_collection("repository")
    val query = BSONDocument("type" -> "web page");
    val configurations = collection.find(query).cursor[AutoSetupConfig].collect[List]()
    configurations
    
  }
  
  def loadConfigurationSentences(confType:String, context:String): Future[List[Configuration]] = {
    val collection = open_collection("configuration")
    val query = BSONDocument("type" -> "service", "rows" -> BSONDocument("$elemMatch" -> BSONDocument("type" -> confType, "name" -> context)));
    val configurations = collection.find(query).cursor[Configuration].collect[List]()
    configurations	  
  }
}

class MongoConnector {

}

