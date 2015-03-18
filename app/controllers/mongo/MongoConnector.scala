package controllers.mongo

import play.api.libs.json.Reads._
import play.api.libs.json.Writes._
import play.api.libs.json._
import reactivemongo.api.{MongoDriver, _}
import reactivemongo.bson.BSONDocument
import reactivemongo.bson.Producer.nameValue2Producer
import reactivemongo.api.collections.default.BSONCollection
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.util.{Failure, Success}
import controllers.parsers.WebPageElement
import controllers.parsers.WebPageElementBSONWriter
import reactivemongo.core.commands.LastError
import reactivemongo.bson.BSONObjectID
import boot.Global

object MongoConnector extends App {
  def apply() = {
    new MongoConnector(new MongoDriver(),List("localhost"), "play_db")
  }
  def apply(url:String) = {
    new MongoConnector(new MongoDriver(),List(url), "play_db")
  }
}


case class MongoConnector(driver: MongoDriver, servers: List[String], database: String){

  implicit val scenarioRowsFormat = Json.format[ScenarioRows] 

  def close(): Unit = {
    db.connection.close()
  }

  val db = driver.connection(servers)(database)

  def open_collection(collection: String) = {
    db(collection)
  }

  def getRepositoryCollection: BSONCollection = {
    db("repository")
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

  def refactorScenarii(config: AutoSetupConfig) {
    val collection = open_collection("scenarii")

    if(config.id != null){
      // BIG OPERATION !! to improve, for instance open a new future
      // and consume the database as a stream
      val query = BSONDocument()
      val scenariiFuture = collection.find(query).cursor[Scenario].collect[List]()
      scenariiFuture.map{
        scenarii => {
          for {
              scenario <- scenarii
              if isScenarioPatternImpacted(scenario, config)
          } yield saveScenario(refactorScenario(scenario, config))
        } 
      }
    }
  }

  def isScenarioPatternImpacted(scenario: Scenario, config: AutoSetupConfig) : Boolean = {
    var isImpacted = false
    if(scenario.rows != null){
      try{
        val scenarioRows = Json.parse(scenario.rows.getOrElse("[]")).as[List[ScenarioRows]]
        for(row <- scenarioRows; mapping <- row.mappings){
          for(configElement <- config.rows.getOrElse(List())){
            if (mapping.id.equals(configElement.id.get)){
              isImpacted = true
            }
          }
        }
      } catch {
        case e: Exception => {
          println("Couldn't parse scenario rows !")
          e.printStackTrace()
        }
      }
    }
    isImpacted
  }

  def refactorScenario(scenario: Scenario, config: AutoSetupConfig):  Scenario = {  
    val scenarioRows = Json.parse(scenario.rows.getOrElse("")).as[List[ScenarioRows]]
    var outputRows = List[ScenarioRows]()
    for(row <- scenarioRows){
      var outputMappings = List[ScenarioRowMapping]()
      for(mapping <- row.mappings){
        for(configElement <- config.rows.getOrElse(List())){
          if (mapping.id.equals(configElement.id.get)) {
            val newMappingValue = config.name + "." + configElement.name
            outputMappings = ScenarioRowMapping(id = mapping.id, value = newMappingValue, pos = mapping.pos) :: outputMappings 
          } else {
            outputMappings = mapping :: outputMappings 
          }
        }
      }
      outputRows = ScenarioRows(patterns = row.patterns, mappings = outputMappings) :: outputRows
    }
    val jsonRowsAsString = Json.stringify(Json.toJson(outputRows)) 
    Scenario(id = scenario.id, name= scenario.name, cType = scenario.cType, driver = scenario.driver, rows = Some(jsonRowsAsString))
  }

  def saveAutoConfiguration(conf: AutoSetupConfig) {
    val collection = open_collection("repository")
    val elementsToPersist: List[WebPageElement] = conf.rows.getOrElse(List())
    val elementAsBsonDocuments: List[BSONDocument] = for(element <- elementsToPersist) yield WebPageElementBSONWriter.write(element)
    val listOfFutures: List[Future[LastError]] = for(element <- elementAsBsonDocuments) yield saveContainerElement(element)
    val futureList = Future.sequence(listOfFutures)
    //once we've completed saving elements
    //we can check here through last errors if everything has been saved !
    futureList.map(_ => {
      //TODO      
    })
    val dbRefs: List[DBRef] = elementAsBsonDocuments match {
      case elements: List[BSONDocument] => elements.map(element => { 
                                              val objectId = element.getAs[BSONObjectID]("_id").get
                                              DBRef("elements", objectId)
                                          })
      case _ => List()
    }
    val autoSetupWithRefs: AutoSetupConfigWithRefs = AutoSetupConfigWithRefs (
      id = conf.id, name = conf.name, cType = conf.cType, rows = Some(dbRefs)
    )

    println("[+] successfully saved configuration elements, persisting configuration..")
    autoSetupWithRefs.id match {
      case None => collection.insert(autoSetupWithRefs).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[+] successfully inserted repository updates !")
      }
      case _ => collection.save(autoSetupWithRefs).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[=] successfully saved repository updates !")
      }
    }
  }

  /**
   * We return a future
   */
  def saveContainerElement(element: BSONDocument): Future[LastError] = {
      val collection = open_collection("elements")
      collection.save(element)
  }

  def saveScenario(scenario: Scenario) {
    val collection = open_collection("scenarii")
    if(scenario.id == null){
      collection.insert(scenario).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[+] successfully inserted scanario !")
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
    loadAutoConfiguration(BSONDocument())
  }

  def loadAutoConfiguration(query: BSONDocument): Future[List[AutoSetupConfig]] = {
    val collection = open_collection("repository")
    val configurationWithRefs: Future[List[AutoSetupConfigWithRefs]] = collection.find(query).cursor[AutoSetupConfigWithRefs].collect[List]()
    // re-compute as configurations
    def convertItems(configurationWithRef: AutoSetupConfigWithRefs): Future[AutoSetupConfig] = {
      configurationWithRef.rows match {
        case Some(refs) => {
          val loadedElementFutureList: Future[List[Option[WebPageElement]]] = Future.sequence(for( ref <- refs ) yield loadElement(ref.id))
          loadedElementFutureList.map(elements => AutoSetupConfig(
                                            id = configurationWithRef.id, 
                                            name = configurationWithRef.name, 
                                            cType = configurationWithRef.cType,
                                            rows = Some(elements.flatMap(_.toList))))
        }
      }
    }
    val convertedListFuture: Future[List[AutoSetupConfig]] = configurationWithRefs.flatMap {
      configurationWithRefs => {
        val configFutureList: Future[List[AutoSetupConfig]] = Future.sequence(for (configurationWithRef <- configurationWithRefs) yield convertItems(configurationWithRef))
        configFutureList
      }
    }
    convertedListFuture
  }



  def loadElement(objectId: BSONObjectID): Future[Option[WebPageElement]] = {
    val collection = open_collection("elements")
    val query = BSONDocument("_id" -> objectId)
    val element = collection.find(query).one[WebPageElement]
    element
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
    loadAutoConfiguration(BSONDocument("type" -> "web page"))
  }

  def loadSwingPagesFromRepository(): Future[List[AutoSetupConfig]] = {
    loadAutoConfiguration(BSONDocument("type" -> "swing page"))
  }

  def loadDefaultConfiguration(): Future[Option[MacroConfiguration]] = {
    val collection = open_collection("cType")
    val query = BSONDocument("type" -> "default")
    val macroConfiguration = collection.find(query).one[MacroConfiguration]
    macroConfiguration
  }

  def loadConfigurationSentences(confType:String, context:String): Future[List[MacroConfiguration]] = {
    val collection = open_collection("configuration")
    val query = BSONDocument("rows" -> BSONDocument("$elemMatch" -> BSONDocument("type" -> confType, "name" -> context)));
    val configurations = collection.find(query).cursor[MacroConfiguration].collect[List]()
    configurations
  }
}