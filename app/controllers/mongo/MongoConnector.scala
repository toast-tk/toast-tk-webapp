package controllers.mongo

import scala.concurrent.duration._
import play.api.libs.json.Reads._
import play.api.libs.json.Writes._
import play.api.libs.json._
import reactivemongo.api.{MongoDriver, _}
import reactivemongo.bson.{BSONObjectID, BSONDocument, BSONArray}
import reactivemongo.api.commands.UpdateWriteResult
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
import boot.AppBoot
import play.api.Logger
import controllers.mongo.User.{BSONWriter => UserBSONWriter} 
import controllers.mongo.User.{BSONReader => UserBSONReader} 
import scala.util._
import java.security.SecureRandom

object MongoConnector extends App {
  def apply() = {
    new MongoConnector(new MongoDriver(),List("localhost"), "play_db")
  }
  def apply(url:String) = {
    new MongoConnector(new MongoDriver(),List(url), "play_db")
  }
}

object BearerTokenGenerator {
  
  val TOKEN_LENGTH = 32
  val TOKEN_CHARS = 
     "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._"
  val secureRandom = new SecureRandom()
    
  def generateToken:String =  
    generateToken(TOKEN_LENGTH)   
  
  def generateToken(tokenLength: Int): String =
    if(tokenLength == 0) "" else TOKEN_CHARS(secureRandom.nextInt(TOKEN_CHARS.length())) + 
     generateToken(tokenLength - 1)
  
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

  def AuthenticateUser(user : InspectedUser) : Option[User] = {
    var isAuthenticated = false
    val query = BSONDocument("login" -> user.login, "password" -> user.password)
    val collection = open_collection("users")
    var authPersonOpt: Option[User]  = None;
    var token:Option[String] = None ;
    val userFuture =
    collection.
    find(query). 
    cursor[User]().
    collect[List]()
    Logger.info("Loging in dfef!")
    Await.result(userFuture.map { users =>
      for(person <- users) {
        token = Some(BearerTokenGenerator.generateToken)
        val authPerson = User(person.id,
          person.login,
          person.password,
          person.firstName,
          person.lastName,
          person.email,
          person.teams,
          token,
          true,
          None)
        authPersonOpt = Some(authPerson)
        println(s"dataobj Token ----> ${authPersonOpt}")
        saveUser(authPerson)
        val firstName = authPerson.firstName
        isAuthenticated = true
        println(s"found $firstName $isAuthenticated")
        authPersonOpt
      }
    }, 5 seconds)
    println(s"just here $isAuthenticated")
    authPersonOpt
  }

/*  def saveUser(user: User) {
    val collection = open_collection("users")
         println(s"[+] successfully gooottt user $user !")

    user.id match {
      case None => collection.insert(user).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[+] successfully inserted ${user.id} and $user !")
      }
      case Some(_) => collection.update(BSONDocument("_id" -> BSONObjectID(user.id.get)), user, upsert=true).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("successfully saved user !")
      }
    }
  }*/

  def saveUser(user: User)  : Future[Boolean] = {
    val collection = open_collection("users")
    println(s"[+] successfully gooottt user $user !")

    user.id match {
      case None => {
         Future{false} //looks like not reached
       }
       case _ => findUserBy(BSONDocument(
        "$or" -> BSONArray(
          BSONDocument(
            "_id" -> BSONDocument("$ne" -> BSONObjectID(user.id.get)),
            "login" -> user.login
            ),
          BSONDocument(
            "_id" -> BSONDocument("$ne" -> BSONObjectID(user.id.get)),
            "email" -> user.email
            )
          )
        )
       ).map{
        case None => {
          collection.insert(user).onComplete {
            case Failure(e) => throw e
            case Success(_) => println("[+] successfully inserted ${user.id} and $user !")
          }
          true
        }
        case Some(user) => {
          println(s"[+] successfully found ${user.id} and $user !")
          false
        }
      }
    }
  }

  def disconnectUser(id : String) : Future[Boolean] = {
    val collection = open_collection("users")
    findUserBy(
          BSONDocument(
            "_id" -> BSONObjectID(id)
            )
       ).map{
        case None => {
          println(s"[+] User not found, could not disconnect properly !")
          false
        }
        case Some(user) => {
          println(s"[+] disconnecting ${id} ${user.id} and $user !")
          collection.update(BSONDocument("_id" -> BSONObjectID(id)), 
              BSONDocument(
                "$set" -> BSONDocument(
                     "isActive" -> false
                  )
              ),
              upsert=false
            ).onComplete {
            case Failure(e) => throw e
            case Success(_) => println("successfully saved configuration !")
          }
          true
        }
      }
  }

  def findUserBy(query: BSONDocument): Future[Option[User]] = {
    val collection = open_collection("users")
    collection.find(query).one[User]
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

  def refactorScenarii(config: AutoSetupConfig) {
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
    Scenario(id = scenario.id, 
             name= scenario.name, 
             cType = scenario.cType, 
             driver = scenario.driver, 
             rows = Some(jsonRowsAsString),
             parent= scenario.parent)
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

  def saveServiceEntityConfiguration(conf: ServiceEntityConfig) {
    val collection = open_collection("repository")
    val elementsToPersist: List[EntityField] = conf.rows.getOrElse(List())
    val elementAsBsonDocuments: List[BSONDocument] = for(element <- elementsToPersist) yield EntityFieldBSONWriter.write(element)
    val listOfFutures: List[Future[UpdateWriteResult]] = for(element <- elementAsBsonDocuments) yield saveContainerElement(element)
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
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(autoSetupWithRefs.id.get)), autoSetupWithRefs, upsert = true).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[=] successfully saved repository updates !")
      }
    }
  }

  def saveAutoConfiguration(conf: AutoSetupConfig) {
    val collection = open_collection("repository")
    val elementsToPersist: List[WebPageElement] = conf.rows.getOrElse(List())
    val elementAsBsonDocuments: List[BSONDocument] = for(element <- elementsToPersist) yield WebPageElementBSONWriter.write(element)
    val listOfFutures: List[Future[UpdateWriteResult]] = for(element <- elementAsBsonDocuments) yield saveContainerElement(element)
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
      case _ => collection.update(BSONDocument("_id" -> BSONObjectID(autoSetupWithRefs.id.get)),autoSetupWithRefs, upsert = true).onComplete {
        case Failure(e) => throw e
        case Success(_) => println("[=] successfully saved repository updates !")
      }
    }
  }

  /**
   * We return a future
   */
  def saveContainerElement(element: BSONDocument): Future[UpdateWriteResult] = {
      val collection = open_collection("elements")
      collection.update(BSONDocument("_id" -> element.get("_id").get),element,upsert=true)
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
    /*val childList = findChildNodes(scenarioId)*/
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

/*  def findChildNodes(nodeId : String): Future[List[Scenario]] ={
     val collection = open_collection("scenarii")
    val query = BSONDocument("parent" -> nodeId)
    var NodeList : List[Scenario] = List()
    var childNodes = collection.find(query).cursor[Scenario]().collect[List]()
      childNodes.map {
      nodes => {

        NodeList = for (node <- nodes) yield {
          var result = Await.result(findChildNodes(node.id.get), 0 nanos)
          NodeList :: result
        }

      }
    }
    childNodes
  }*/

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

  def loadDefaultSuperAdminUser(): Future[Option[User]] = {
    loadUser("admin")
  }

  def loadUser(login: String): Future[Option[User]] = {
    val collection = open_collection("users")
    val query = BSONDocument("login" -> login)
    val user = collection.find(query).one[User]
    user
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

  def loadAutoConfiguration(query: BSONDocument): Future[List[AutoSetupConfig]] = {
    val collection = open_collection("repository")
    val configurationWithRefs: Future[List[AutoSetupConfigWithRefs]] = collection.find(query).sort(BSONDocument("name" -> 1)).cursor[AutoSetupConfigWithRefs]().collect[List]()
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
    collection.find(query, filter).cursor[BSONDocument]().collect[List]().map{
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
    val configurations = collection.find(query).cursor[MacroConfiguration]().collect[List]()
    configurations
  }
}