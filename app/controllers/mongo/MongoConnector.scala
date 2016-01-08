package controllers.mongo

import scala.concurrent.duration._
import play.api.libs.json.Reads._
import play.api.libs.json.Writes._
import play.api.libs.json._
import reactivemongo.api.{MongoDriver, _}
import reactivemongo.bson.BSONDocument
import reactivemongo.bson.Producer.nameValue2Producer
import reactivemongo.api.collections.bson.BSONCollection
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.concurrent.Await
import scala.util.{Failure, Success}
import controllers.parsers.EntityField
import controllers.parsers.WebPageElement
import controllers.parsers.WebPageElementBSONWriter
import controllers.parsers.EntityFieldBSONWriter
import reactivemongo.core.commands.LastError
import reactivemongo.bson.BSONObjectID
import boot.AppBoot

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
      collection.update(BSONDocument("_id" -> BSONObjectID(conf.id.get)), conf).onComplete {
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
        for(row <- scenarioRows; mapping <- row.mappings.getOrElse(List())){
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

  def convertJsonToScenarioRows(scenario: Scenario): List[ScenarioRows] = {
    val scenarioRows = Json.parse(scenario.rows.getOrElse("")).as[List[ScenarioRows]]
    scenarioRows
  }

  def updateScenario(scenario: Scenario):  Scenario = {  
    import scala.util.control.Breaks._
    val scenarioRows: List[ScenarioRows] = convertJsonToScenarioRows(scenario)
    println(scenarioRows)
    var outputRows = List[ScenarioRows]()
    for(row <- scenarioRows){
      var outputMappings = List[ScenarioRowMapping]()
      for(mapping <- row.mappings.getOrElse(List())){
        var mappingUpdate: Boolean = false;
        if(mapping.id.equals("component")){ //lame hack, to fix as soon as possible on editor.js side also
          val pageName = mapping.value.split("[.]")(0)
          val componentName = mapping.value.split("[.]")(1)
          val pages: List[AutoSetupConfig] = Await.result(loadSwingPagesFromRepositoryByName(pageName), 5 seconds).asInstanceOf[List[AutoSetupConfig]]
          if(pages.isDefinedAt(0)){
            val page = pages(0)
            breakable { 
              for(component <- page.rows.getOrElse(List())){
                if(component.name.equals(componentName)){
                  outputMappings = ScenarioRowMapping(id = component.id.getOrElse(mapping.id), value = mapping.value, pos = mapping.pos) :: outputMappings 
                  mappingUpdate = true
                  break
                }
              } 
            }
          }else{
            //Log something
          }   
        } 
        if(!mappingUpdate){
          outputMappings = mapping :: outputMappings 
        }
      }
      outputRows = ScenarioRows(patterns = row.patterns, kind = row.kind, mappings = Some(outputMappings)) :: outputRows
    }
    val jsonRowsAsString = Json.stringify(Json.toJson(outputRows.reverse)) 
     println(jsonRowsAsString)
    Scenario(id = scenario.id, name= scenario.name, cType = scenario.cType, driver = scenario.driver, rows = Some(jsonRowsAsString))
  }

  def refactorScenario(scenario: Scenario, config: AutoSetupConfig):  Scenario = {  
    val scenarioRows = convertJsonToScenarioRows(scenario)
    var outputRows = List[ScenarioRows]()
    for(row <- scenarioRows){
      var outputMappings = List[ScenarioRowMapping]()
      for(mapping <- row.mappings.getOrElse(List())){
        for(configElement <- config.rows.getOrElse(List())){
          if (mapping.id.equals(configElement.id.get)) {
            val newMappingValue = config.name + "." + configElement.name
            outputMappings = ScenarioRowMapping(id = mapping.id, value = newMappingValue, pos = mapping.pos) :: outputMappings 
          } else {
            outputMappings = mapping :: outputMappings 
          }
        }
      }
      outputRows = ScenarioRows(patterns = row.patterns, kind = row.kind, mappings = Some(outputMappings)) :: outputRows
    }
    val jsonRowsAsString = Json.stringify(Json.toJson(outputRows)) 
    Scenario(id = scenario.id, name= scenario.name, cType = scenario.cType, driver = scenario.driver, rows = Some(jsonRowsAsString))
  }

  def saveServiceEntityConfiguration(conf: ServiceEntityConfig) {
    val collection = open_collection("repository")
    val elementsToPersist: List[EntityField] = conf.rows.getOrElse(List())
    val elementAsBsonDocuments: List[BSONDocument] = for(element <- elementsToPersist) yield EntityFieldBSONWriter.write(element)
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
    val autoSetupWithRefs: ServiceEntityConfigWithRefs = ServiceEntityConfigWithRefs (
      id = conf.id, name = conf.name, cType = conf.cType, rows = Some(dbRefs)
    )

    println("[+] successfully saved configuration elements, persisting configuration..")
    autoSetupWithRefs.id match {
      case None => collection.insert(autoSetupWithRefs).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[+] successfully inserted repository updates !")
      }
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(autoSetupWithRefs.id.get)), autoSetupWithRefs).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[=] successfully saved repository updates !")
      }
    }
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
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(autoSetupWithRefs.id.get)),autoSetupWithRefs).onComplete {
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
      collection.update(element)
  }


  def deleteObject(autoSetupId: String) {
    val collection = open_collection("repository")
    collection.remove(BSONDocument("_id" -> BSONObjectID(autoSetupId))).onComplete {
      case Failure(e) => throw e
      case Success(_) => println(s"[+] successfully removed object from respository: $autoSetupId")
    }
  }

  def deleteScenarii(scenarioId: String) {
    val collection = open_collection("scenarii")
    collection.remove(BSONDocument("_id" -> BSONObjectID(scenarioId))).onComplete {
      case Failure(e) => throw e
      case Success(_) => println(s"[+] successfully removed scanario: $scenarioId")
    }
  }

  def saveScenario(scenario: Scenario) {
    val collection = open_collection("scenarii")
    scenario.id match {
      case None => collection.insert(updateScenario(scenario)).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[+] successfully inserted scanario !")
      }
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(scenario.id.get)), updateScenario(scenario)).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("successfully saved scanario !")
      }
    }
  }

  def savePlainScenario(scenario: Scenario) {
    val collection = open_collection("scenarii")
    scenario.id match {
      case None => collection.insert(scenario).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[+] successfully inserted scanario !")
      }
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(scenario.id.get)), scenario).onComplete {
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

  def loadWebPageRepository(): Future[List[AutoSetupConfig]] = {
    loadAutoConfiguration(BSONDocument("type" -> "web page"))
  }

  def loadSwingPageRepository(): Future[List[AutoSetupConfig]] = {
    loadAutoConfiguration(BSONDocument("type" -> "swing page"))
  }

  def loadServiceEntityRepository(): Future[List[ServiceEntityConfig]] = {
    loadServiceAutoConfiguration(BSONDocument("type" -> "service entity"))
  }

  def loadServiceAutoConfiguration(query: BSONDocument): Future[List[ServiceEntityConfig]] = {
    val collection = open_collection("repository")
    val configurationWithRefs: Future[List[ServiceEntityConfigWithRefs]] = collection.find(query).sort(BSONDocument("name" -> 1)).cursor[ServiceEntityConfigWithRefs].collect[List]()
    // re-compute as configurations
    def convertItems(configurationWithRef: ServiceEntityConfigWithRefs): Future[ServiceEntityConfig] = {
      configurationWithRef.rows match {
        case Some(refs) => {
          val loadedElementFutureList: Future[List[Option[EntityField]]] = Future.sequence(for( ref <- refs ) yield loadEntityField(ref.id))
          loadedElementFutureList.map(elements => ServiceEntityConfig(
                                            id = configurationWithRef.id, 
                                            name = configurationWithRef.name, 
                                            cType = configurationWithRef.cType,
                                            rows = Some(elements.flatMap(_.toList))))
        }
      }
    }
    val convertedListFuture: Future[List[ServiceEntityConfig]] = configurationWithRefs.flatMap {
      configurationWithRefs => {
        val configFutureList: Future[List[ServiceEntityConfig]] = Future.sequence(for (configurationWithRef <- configurationWithRefs) yield convertItems(configurationWithRef))
        configFutureList
      }
    }
    convertedListFuture
  }

  def loadAutoConfiguration(query: BSONDocument): Future[List[AutoSetupConfig]] = {
    val collection = open_collection("repository")
    val configurationWithRefs: Future[List[AutoSetupConfigWithRefs]] = collection.find(query).sort(BSONDocument("name" -> 1)).cursor[AutoSetupConfigWithRefs].collect[List]()
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

  def loadEntityField(objectId: BSONObjectID): Future[Option[EntityField]] = {
    val collection = open_collection("elements")
    val query = BSONDocument("_id" -> objectId)
    collection.find(query).one[EntityField]
  }
  def loadElement(objectId: BSONObjectID): Future[Option[WebPageElement]] = {
    val collection = open_collection("elements")
    val query = BSONDocument("_id" -> objectId)
    collection.find(query).one[WebPageElement]
  }

  def loadScenarioById(id: String): Future[Option[Scenario]] = {
    val collection = open_collection("scenarii")
    val query = BSONDocument("_id" -> BSONObjectID(id))
    collection.find(query).one[Scenario]
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

  def loadSwingPagesFromRepositoryByName(name: String): Future[List[AutoSetupConfig]] = {
    loadAutoConfiguration(BSONDocument("type" -> "swing page", "name" -> name))
  }

  def loadSwingPagesFromRepository(): Future[List[AutoSetupConfig]] = {
    loadAutoConfiguration(BSONDocument("type" -> "swing page"))
  }

  def loadDefaultConfiguration(): Future[Option[MacroConfiguration]] = {
    loadMacroConfiguration("default")
  }

  def loadMacroConfiguration(cType: String): Future[Option[MacroConfiguration]] = {
    val collection = open_collection("configuration")
    val query = BSONDocument("type" -> cType)
    val macroConfiguration = collection.find(query).one[MacroConfiguration]
    macroConfiguration
  }

  def loadConfigurationSentences(confType:String): Future[List[MacroConfiguration]] = {
    val collection = open_collection("configuration")
    val query = BSONDocument("rows" -> BSONDocument("$elemMatch" -> BSONDocument("type" -> confType)));
    val configurations = collection.find(query).cursor[MacroConfiguration].collect[List]()
    configurations
  }
}