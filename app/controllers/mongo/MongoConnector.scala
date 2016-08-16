package controllers.mongo

import controllers.mongo.repository.RepositoryCollection

import scala.concurrent.duration._
import play.api.libs.json.Writes._
import play.api.libs.json._
import reactivemongo.api.{MongoDriver, _}
import reactivemongo.bson._
import reactivemongo.api.commands.{UpdateWriteResult, WriteResult}
import reactivemongo.bson.Producer.nameValue2Producer

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Future
import scala.concurrent.Await
import scala.util.{Failure, Success}
import controllers.parsers.EntityField
import controllers.parsers.WebPageElement

import controllers.mongo.teams._
import controllers.mongo.users._

object MongoConnector extends App {
  def apply() = {
    new MongoConnector(new MongoDriver(),List("localhost"), "play_db")
  }
  def apply(url:String) = {
    new MongoConnector(new MongoDriver(),List(url), "play_db")
  }
}

case class MongoConnector(driver: MongoDriver, servers: List[String], database: String){
  val db = driver.connection(servers)(database)
  val userCollection = UserCollection(open_collection("users"))
  val teamCollection = TeamCollection(open_collection("teams"))
  val repositoryCollection = RepositoryCollection(open_collection("repository"), open_collection("elements"))



  def init() = {
    teamCollection.initDefaultTeam().map{
      team =>
        userCollection.initAdminAccount(team)
    }
  }

  def saveAutoConfiguration(impl: RepositoryImpl) ={
    repositoryCollection.saveAutoConfiguration(impl)
  }

  implicit val scenarioRowsFormat = Json.format[ScenarioRows] 

  def close(): Unit = {
    db.connection.close()
  }

  def open_collection(collection: String) = {
    db(collection)
  }

  def AuthenticateUser(user : InspectedUser) : Option[User] = {
    userCollection.AuthenticateUser(user)
  }

  def saveUser(user: User)   : Future[Boolean] = {
    userCollection.saveUser(user)
  }

  def disconnectUser(id : String) : Future[Boolean] = {
    userCollection.disconnectUser(id)
  }

  def removeUser(id : String) : Future[WriteResult] = {
    userCollection.removeUser(id)
  }

  def getAllUsers() : Future[List[User]] ={
    userCollection.getAllUsers()
  }

  def editUser(id: String): Future[Option[User]] = {

    val collection = open_collection("users")
    val bsonId = BSONObjectID(id)
    val query = BSONDocument("_id" -> bsonId)
    collection.find(query).one[User]
  }

  def saveTeam(team: Team)  : Future[Boolean] = {
    teamCollection.save(team)
  }

  def getAllTeams() : Future[List[Team]] ={
    teamCollection.getAllTeams()
  }

  def saveConfiguration(conf: MacroConfiguration) {
    val collection = open_collection("configuration")
    conf.id match {
      case None => collection.insert(conf).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[+] successfully inserted configuration !")
      }
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(conf.id.get)), conf, upsert=true).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("successfully saved configuration !")
      }
    }
  }

  def refactorScenarii(config: RepositoryImpl) {
    val collection = open_collection("scenarii")

    if(config.id != null){
      // BIG OPERATION !! to improve, for instance open a new future
      // and consume the database as a stream
      val query = BSONDocument()
      val scenariiFuture = collection.find(query).cursor[Scenario]().collect[List]()
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

  def isScenarioPatternImpacted(scenario: Scenario, config: RepositoryImpl) : Boolean = {
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
          val pages: List[RepositoryImpl] = Await.result(loadSwingPagesFromRepositoryByName(pageName), 5 seconds).asInstanceOf[List[RepositoryImpl]]
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
    Scenario(id = scenario.id, 
             name= scenario.name, 
             cType = scenario.cType, 
             driver = scenario.driver, 
             rows = Some(jsonRowsAsString),
             parent= scenario.parent)
  }

  def refactorScenario(scenario: Scenario, config: RepositoryImpl):  Scenario = {
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
      outputRows = outputRows :+ ScenarioRows(patterns = row.patterns, kind = row.kind, mappings = Some(outputMappings))

    }
    val jsonRowsAsString = Json.stringify(Json.toJson(outputRows)) 
    Scenario(id = scenario.id, 
            name= scenario.name, 
            cType = scenario.cType, 
            driver = scenario.driver, 
            rows = Some(jsonRowsAsString),
            parent= scenario.parent)
  }

  def deleteObject(autoSetupId: String) {
    val collection = open_collection("repository")
    collection.remove(BSONDocument("_id" -> BSONObjectID(autoSetupId))).onComplete {
      case Failure(e) => throw e
      case Success(_) => println(s"[+] successfully removed object from respository: $autoSetupId")
    }
  }

  def deleteScenarii(scenarioId: String) : Future[Boolean] ={
    val collection = open_collection("scenarii")
    hasChildNodes(scenarioId).map {
      case false => {
        collection.remove(BSONDocument("_id" -> BSONObjectID(scenarioId))).onComplete {
          case Failure(e) => throw e
          case Success(_) => println(s"[+] successfully removed scanario: $scenarioId")
        }
        true
      }
       case true => {
        false
       }
     }
  }

  def hasChildNodes(nodeId : String): Future[Boolean] ={
     val collection = open_collection("scenarii")
     collection.find(BSONDocument("parent" -> nodeId)).one[Scenario].map{
      case None => {
        false
      }
      case Some(childNode) => {
        true
      }
     }
  }

  def findOneScenarioBy(query: BSONDocument): Future[Option[Scenario]] = {
    val collection = open_collection("scenarii")
    collection.find(query).one[Scenario]
  }

  def insertScenario(scenario: Scenario) : Future[Boolean] = {
    val collection = open_collection("scenarii")
    findOneScenarioBy(BSONDocument("name" -> scenario.name, "parent" -> scenario.parent.get)).map {
      case None => {
        collection.insert(updateScenario(scenario)).onComplete {
          case Failure(e) => throw e
          case Success(_) => println("[+] successfully inserted scanario !")
        }
        true
      }
      case Some(foundScenario) => {
        println("[+] ERROR; scenario existe deja!")
        false
      }
    }
  }

  def saveScenario(scenario: Scenario) : Future[Boolean] = {
    val collection = open_collection("scenarii")
    scenario.id match {
      case None => {
          insertScenario(scenario) //to check:probably not reached
          Future{false} //looks like not reached
        }
        case _ => findOneScenarioBy(BSONDocument("_id" -> BSONDocument("$ne" -> BSONObjectID(scenario.id.get)), "name" -> scenario.name, "parent" -> scenario.parent.get)).map{
          case None => {          
            collection.update(BSONDocument("_id" -> BSONObjectID(scenario.id.get)), updateScenario(scenario), upsert=true).onComplete {
              case Failure(e) => throw e
              case Success(_) => println("successfully saved scanario !")
            }
            true
          }
          case Some(foundScenario) => {
            false
          }
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
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(scenario.id.get)), scenario, upsert=true).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("successfully saved scanario !")
      }
    }
  }

  def loadUser(login: String): Future[Option[User]] = {
    userCollection.loadUser(login)
  }

  def loadConfiguration(): Future[List[MacroConfiguration]] = {
    val collection = open_collection("configuration")
    val query = BSONDocument()
    val configurations = collection.find(query).cursor[MacroConfiguration]().collect[List]()
    configurations
  }

  def loadScenarii(): Future[List[Scenario]] = {
    val collection = open_collection("scenarii")
    val query = BSONDocument()
    val scenarii = collection.find(query).cursor[Scenario]().collect[List]()
    scenarii
  }

  def loadWebPageRepository(): Future[List[RepositoryImpl]] = {
    loadAutoConfiguration(BSONDocument("type" -> "web page"))
  }

  def loadSwingPageRepository(): Future[List[RepositoryImpl]] = {
    loadAutoConfiguration(BSONDocument("type" -> "swing page"))
  }

  def loadServiceAutoConfiguration(query: BSONDocument): Future[List[ServiceEntityConfig]] = {
    val collection = open_collection("repository")
    val configurationWithRefs: Future[List[ServiceEntityConfigWithRefs]] = collection.find(query).sort(BSONDocument("name" -> 1)).cursor[ServiceEntityConfigWithRefs]().collect[List]()
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

  def loadAutoConfiguration(query: BSONDocument): Future[List[RepositoryImpl]] = {
    val collection = open_collection("repository")
    val configurationWithRefs: Future[List[AutoSetupConfigWithRefs]] = collection.find(query).sort(BSONDocument("name" -> 1)).cursor[AutoSetupConfigWithRefs]().collect[List]()
    // re-compute as configurations
    def convertItems(configurationWithRef: AutoSetupConfigWithRefs): Future[RepositoryImpl] = {
      configurationWithRef.rows match {
        case Some(refs) => {
          val loadedElementFutureList: Future[List[Option[WebPageElement]]] = Future.sequence(for( ref <- refs ) yield loadElement(ref.id))
          loadedElementFutureList.map(elements => RepositoryImpl(
                                            id = configurationWithRef.id, 
                                            name = configurationWithRef.name, 
                                            cType = configurationWithRef.cType,
                                            rows = Some(elements.flatMap(_.toList))))
        }
      }
    }
    val convertedListFuture: Future[List[RepositoryImpl]] = configurationWithRefs.flatMap {
      configurationWithRefs => {
        val configFutureList: Future[List[RepositoryImpl]] = Future.sequence(for (configurationWithRef <- configurationWithRefs) yield convertItems(configurationWithRef))
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
    collection.find(query, filter).cursor[BSONDocument]().collect[List]().map{
      documents => for(document <- documents) yield document.getAs[String]("rows").get
    }
  }

  def loadWebPagesFromRepository(): Future[List[RepositoryImpl]] = {
    loadAutoConfiguration(BSONDocument("type" -> "web page"))
  }

  def loadSwingPagesFromRepositoryByName(name: String): Future[List[RepositoryImpl]] = {
    loadAutoConfiguration(BSONDocument("type" -> "swing page", "name" -> name))
  }

  def loadSwingPagesFromRepository(): Future[List[RepositoryImpl]] = {
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
    val configurations = collection.find(query).cursor[MacroConfiguration]().collect[List]()
    configurations
  }
}