package controllers.mongo

import java.util.concurrent.TimeUnit

import controllers.mongo.project.{Project, ProjectCollection}
import controllers.mongo.repository.RepositoryCollection
import controllers.mongo.scenario.{Scenario, ScenarioCollection}

import play.api.libs.json._
import reactivemongo.api.{MongoDriver, _}
import reactivemongo.bson._
import reactivemongo.api.commands.{UpdateWriteResult, WriteResult}
import reactivemongo.bson.Producer.nameValue2Producer

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future}
import scala.util.{Failure, Success}
import controllers.parsers.EntityField

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
  val projectCollection = ProjectCollection(open_collection("projects"))
  val scenarioCollection = ScenarioCollection(open_collection("scenarii"), repositoryCollection)
  val timeout = Duration(5, TimeUnit.SECONDS)

  def init() = {
    projectCollection.initDefault().map{
      project =>
        teamCollection.initDefaultTeam(project).map{
          team =>
            userCollection.initAdminAccount(team)
        }
    }
  }

  def saveAutoConfiguration(impl: Repository) ={
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
    val projects:List[Project] = for{
      project <- team.projects
    } yield (Await.result(projectCollection.save(project), timeout))
    team._id match {
      case None => {
        val newTeam = Team( name = team.name,
                description = team.description,
                projects = projects) 
        teamCollection.save(newTeam)
      }
      case _ => {
        val newTeam = Team(
                _id = team._id,
                name = team.name,
                description =  team.description,
                projects = projects) 
        teamCollection.save(newTeam)
      }
    }
  }

  def getAllTeams() : Future[List[Team]] ={
    teamCollection.getAllTeams()
  }

  def getAllProjects(): Future[List[Project]]  = {
    projectCollection.list()
  }

  def getProject(idProject: String): Future[Option[Project]] = {
    projectCollection.one(idProject)
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

  def findRepositoriesByNameAndProject(maybeProject: Option[Project], repositoryName: String) = {
    repositoryCollection.findRepositoriesByNameAndProject(maybeProject.get, repositoryName)
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

  def savePlainScenario(scenario: Scenario) {
    val collection = open_collection("scenarii")
    collection.update(BSONDocument("_id" ->scenario._id), scenario, upsert=true).onComplete {
      case Failure(e) => throw e
      case Success(_) => println("successfully saved scanario !")
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

  def upsertScenario(scenario: Scenario): Future[UpdateWriteResult] =  {
    val result: Future[UpdateWriteResult] = scenarioCollection.upsertScenario(scenario)
    result
  }

  def refactorScenarii(impl: Repository) = {
    scenarioCollection.refactorScenarii(impl)
  }


  def loadScenarii(idProject: String): Future[List[Scenario]] = {
    val future = for{
      project <- projectCollection.one(idProject)
      result <- scenarioCollection.findProjectScenarios(project.get)
      if(project.isDefined)
    } yield (result)
    future
  }

  def loadWebPageRepository(idProject: String): Future[List[Repository]] = {
    val future = for{
      project <- projectCollection.one(idProject)
      result <- repositoryCollection.findProjectWebRepositories(project.get)
      if(project.isDefined)
    } yield (result)
    future
  }

  def loadSwingPageRepository(idProject: String): Future[List[Repository]] = {
    val future = for{
      project <- projectCollection.one(idProject)
      result <-  repositoryCollection.findProjectSwingRepositories(project.get)
      if(project.isDefined)
    } yield (result)
    future

  }

  def loadEntityField(objectId: BSONObjectID): Future[Option[EntityField]] = {
    val collection = open_collection("elements")
    val query = BSONDocument("_id" -> objectId)
    collection.find(query).one[EntityField]
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

  def saveProject(project: Project): Project = {
    project._id match {
      case None => {
        var newProject = Project(name = project.name, description = project.description)
        projectCollection.save(newProject)
        newProject
      }
      case _ => {
        projectCollection.save(project)
        project
      }
    }
  }

  def findScenario(scenarioName: String, maybeProject: Option[Project]) = {
    scenarioCollection.findProjectScenario(scenarioName, maybeProject)
  }

  def findScenarioById(idScenario: String) = {
    scenarioCollection.findScenarioById(idScenario)
  }

  def getTeam(idTeam: String) = {
    teamCollection.findTeamBy(BSONDocument("_id"-> BSONObjectID(idTeam)))
  }

  def userProjectPair(token: String): (Option[User], Option[Project]) = {
    val userResult: Option[User] = Await.result(userCollection.findUserBy(BSONDocument("token" -> token)), timeout)
    userResult match {
      case Some(user) => {
        val projectResult: Option[Project] = user.idProject match {
          case Some(id) => Await.result(projectCollection.one(id), timeout)
          case None => None
        }
        (userResult, projectResult)
      }
      case None => (None, None)
    }

  }

}