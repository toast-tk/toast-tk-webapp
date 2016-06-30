package controllers.mongo.users

import scala.util.{Failure, Success}

import scala.concurrent.duration._
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.Await

import reactivemongo.api.collections.bson.BSONCollection
import reactivemongo.bson.{BSONObjectID, BSONDocument, BSONArray}
import reactivemongo.api.commands.WriteResult


import java.security.SecureRandom

case class UserCollection(collection: BSONCollection){

  def AuthenticateUser(user : InspectedUser) : Option[User] = {
    var isAuthenticated = false
    val query = BSONDocument("login" -> user.login, "password" -> user.password)
    var authPersonOpt: Option[User] = None;
    var token: Option[String] = None;
    val userFuture =
      collection.
        find(query).
        cursor[User]().
        collect[List]()
    Await.result(userFuture.map { users =>
      for (person <- users) {
        token = Some(BearerTokenGenerator.generateToken)
        val authPerson = User(person.id,
          person.login,
          person.password,
          person.firstName,
          person.lastName,
          person.email,
          person.teams,
          token,
          Some(true),
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

  def saveUser(user: User)  : Future[Boolean] = {
    user.id match {
      case None => {
         Future{false} //no id provided
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
        case Some(foundUser) => {
          collection.update(BSONDocument("_id" -> BSONObjectID(foundUser.id.get)),
            BSONDocument(
              "$set" -> BSONDocument(
                "firstName"-> user.firstName,
                "lastName" -> user.lastName,
                "email" -> user.email,
                "teams" -> user.teams.getOrElse(List()),
                "token" -> user.token.getOrElse(""),
                "isActive" -> user.isActive.getOrElse(false),
                "lastConnection" -> user.lastConnection.getOrElse("11/11/1111")
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
  }

  def disconnectUser(id : String) : Future[Boolean] = {
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

  object BearerTokenGenerator {
    val TOKEN_LENGTH = 32
    val TOKEN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._"
    val secureRandom = new SecureRandom()

    def generateToken:String = {
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

}