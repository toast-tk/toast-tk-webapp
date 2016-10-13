package controllers.mongo.users

import java.util.Date

import controllers.mongo.teams.Team

import scala.util.{Failure, Success}
import play.api.Logger
import java.util.concurrent.TimeUnit


import scala.concurrent.duration._
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Await

import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.bson.{BSONObjectID, BSONDocument, BSONArray}
import reactivemongo.api.commands.WriteResult


import java.security.SecureRandom

case class UserCollection(collection: BSONCollection){

  val adminLogin = "admin"
  val timeout = Duration(15, TimeUnit.SECONDS)

  def initAdminAccount(team: Team): Future[Boolean] = {
    loadUser(adminLogin).map{
      case Some(user) => {
        //NO-OP
        true
      }
      case _ => {
        Await.result(persistDefaultSuperAdminUser(team), timeout)
      }
    }
  }

  def loadUser(login: String): Future[Option[User]] = {
    val query = BSONDocument("login" -> login)
    val user = collection.find(query).one[User]
    user
  }

  def AuthenticateUser(user : InspectedUser) : Option[User] = {

    val query = BSONDocument("login" -> user.login, "password" -> user.password)
    var authPersonOpt: Option[User] = None;
    val userFuture = collection.find(query).cursor[User]().collect[List]()
    //FIXME: we must find only one user in here !!
    Await.result(userFuture.map { users =>
      for (person <- users) {
        val authPerson = User(
          person.login,
          person.password,
          person.firstName,
          person.lastName,
          person.email,
          person.teams,
          person.token,
          Some(true),
          person.lastConnection,
          person._id,
          person.idProject)
        authPersonOpt = Some(authPerson)
        saveUser(authPerson)
        val firstName = authPerson.firstName
        authPersonOpt
      }
    }, 5 seconds)
    authPersonOpt
  }

  def saveUser(user: User)  : Future[Boolean] = {
    findUserBy(
      BSONDocument(
        "$or" -> BSONArray(
          BSONDocument("_id" -> user._id.get),
          BSONDocument("login" -> user.login)
        )
      )
    ).map{
      case None => {
        Logger.info("[+] inserting user information : " + user._id.get.stringify)

        collection.insert(user).onComplete {
          case Failure(e) => throw e
          case Success(_) => println("[+] successfully inserted ${user.id} and $user !")
        }
        true
      }
      case Some(foundUser) => {
        Logger.info("[+] updating user information : " + foundUser._id.get.stringify)
        val userToken = if(user.token == None){
            if(foundUser.token == None){
              BearerTokenGenerator.generateToken()
            }else {
              foundUser.token.get 
            }
        }else{
            user.token.get
        }
        collection.update(BSONDocument("_id" -> foundUser._id),
          BSONDocument(
            "$set" -> BSONDocument(
              "firstName"-> user.firstName,
              "lastName" -> user.lastName,
              "email" -> user.email,
              "teams" -> user.teams.getOrElse(List()),
              "token" -> userToken,
              "isActive" -> true,
              "lastConnection" -> user.lastConnection.getOrElse(new Date().toString),
              "idProject" -> user.idProject
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

  def disconnectUser(id : String) : Future[Boolean] = {
    findUserBy(
      BSONDocument(
        "_id" -> BSONObjectID(id)
      )
    ).map{
      case None => {
        Logger.info(s"[+] User not found, could not disconnect properly !")
        false
      }
      case Some(user) => {
        println(s"[+] disconnecting ${user._id} and $user !")
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
    collection.find(query).one[User]
  }

  def getAllUsers() : Future[List[User]] ={
    val query = BSONDocument()
    val users = collection.find(query).cursor[User]().collect[List]()
    users
  }

  def removeUser(id : String) : Future[WriteResult] = {
    val selector = BSONDocument("_id" -> BSONObjectID(id))
    collection.remove(selector)
  }

  private def persistDefaultSuperAdminUser(team: Team): Future[Boolean] = {
    def sha256(s: String): String = {
      val m = java.security.MessageDigest.getInstance("SHA-256").digest(s.getBytes("UTF-8"))
      m.map("%02x".format(_)).mkString
    }
    val adminPwd = sha256("admin")

    saveUser(
      User(
        login = "admin",
        password = Some(adminPwd),
        firstName = "Administrator",
        lastName = "",
        email = "admin@toast-tk.io",
        teams = Some(List(team)),
        lastConnection = None
      )
    )
  }
}


object BearerTokenGenerator {
  val TOKEN_LENGTH = 32
  val TOKEN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._"
  val secureRandom = new SecureRandom()

  def generateToken() :String = {
    generateToken(TOKEN_LENGTH)
  }

  def generateToken(tokenLength: Int): String = {
    if(tokenLength == 0){
      ""
    }
    else {
      TOKEN_CHARS(secureRandom.nextInt(TOKEN_CHARS.length())) + generateToken(tokenLength - 1)
    }

  }

}