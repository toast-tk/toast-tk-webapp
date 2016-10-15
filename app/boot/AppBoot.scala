package boot

import controllers.mongo._
import controllers.mongo.project.Project
import controllers.mongo.users.User

import play.api.{UsefulException, Logger}
import play.api.mvc._
import play.api.mvc.Results._
import play.api.routing.Router

import pdi.jwt._

import toast.engine.DAOJavaWrapper
import com.github.jmkgreen.morphia.logging.MorphiaLoggerFactory
import com.github.jmkgreen.morphia.logging.slf4j.SLF4JLogrImplFactory
import scala.concurrent.Future
import scala.reflect.runtime.{universe => ru}
import scala.reflect.runtime.universe._

@scala.annotation.meta.companionMethod
class ApiKeyProtected() extends scala.annotation.Annotation with scala.annotation.StaticAnnotation {
}

@scala.annotation.meta.companionMethod
class AdminProtected() extends scala.annotation.Annotation with scala.annotation.StaticAnnotation {
}

@scala.annotation.meta.companionMethod
class JwtProtected() extends scala.annotation.Annotation with scala.annotation.StaticAnnotation {
}


import scala.concurrent.ExecutionContext.Implicits.global

object AuthorisationFilter extends Filter {
  val mirror = ru.runtimeMirror(getClass.getClassLoader)

  def apply(next: (RequestHeader) => Future[Result])(request: RequestHeader): Future[Result] = {
    val methodSymbol: ru.MethodSymbol = handlerForRoute(request)
    if(isProtectedWithApiKey(methodSymbol)){
      checkTokenValidity(next, request)
    }
    else if (isJwtProtected(methodSymbol)){
      checkJwtTokenValidity(next, request, methodSymbol)
    }
    else {
      next(request)
    }
  }

  protected def checkJwtTokenValidity(next: (RequestHeader) => Future[Result], request: RequestHeader, methodSymbol: ru.MethodSymbol): Future[Result] = {
    Logger.debug("received jwt session: " + request.jwtSession)
    request.jwtSession.getAs[User]("user") match {
      case Some(user) => {
        if (user.isActive.get == true) {
          if (isAdminProtected(methodSymbol)) {
            if (user.isAdmin.get == true) {
              next(request)
            } else {
              Future(Unauthorized("This action requires admin privileges.").refreshJwtSession(request))
            }
          } else {
            next(request)
          }
        } else {
          Future(Forbidden("User is not active.").refreshJwtSession(request))
        }
      }
      case _ => Future(Redirect("/", 401))
    }
  }

  protected def checkTokenValidity(next: (RequestHeader) => Future[Result], request: RequestHeader): Future[Result] = {
    val maybeToken = request.headers.get("Token")
    maybeToken match {
      case Some(token) => {
        Logger.info("Checking token: " + token)
        hasUserAndProject(token) match {
          case true => {
            next(request)
          }
          case false => {
            Future(Unauthorized("Request rejected: provided api key is invalid !"))
          }
        }
      }
      case None => {
        Future(Unauthorized("Request rejected: accessing this route requires an api key !"))
      }
    }
  }

  protected def handlerForRoute(request: RequestHeader): ru.MethodSymbol = {
    if(!request.tags.keySet.contains(Router.Tags.RouteController)){
      Future.successful(NotFound(views.html.notfound()))
    }
    val clazz = Class.forName(request.tags(Router.Tags.RouteController))
    val classSymbolType = mirror.classSymbol(clazz).toType
    val methodName = TermName(request.tags(Router.Tags.RouteActionMethod))
    val classCompanion = classSymbolType.companion
    val methodSymbol: MethodSymbol = classCompanion.member(methodName).asMethod
    methodSymbol
  }

  def isAdminProtected(method: MethodSymbol): Boolean = {
    method.annotations.exists(a => a.tree.tpe =:= typeOf[AdminProtected])
  }

  def isJwtProtected(method: MethodSymbol): Boolean = {
    method.annotations.exists(a => a.tree.tpe =:= typeOf[JwtProtected])
  }

  def isProtectedWithApiKey(method: MethodSymbol): Boolean = {
    method.annotations.exists(a => a.tree.tpe =:= typeOf[ApiKeyProtected])
  }

  /**
   * Check if provided token belongs to a user having a default project
   * @param token
   * @return
   */
  private def hasUserAndProject(token: String): Boolean = {
    val pair: (Option[User], Option[Project]) = ConnectionHolder.getDB().userProjectPair(token)
    pair match {
      case (Some(user), Some(project)) => {
        true
      }
      case _ => false
    }
  }
}

object ConnectionHolder {
  var database: MongoConnector = null

  def setDB(db: MongoConnector): Unit = {
    database = db
  }

  def getDB()= {
    database
  }
}


object AppBoot extends WithFilters(AuthorisationFilter) {

  val KeyMongoDbUrl = "mongo.db.url"
  var db: MongoConnector = _

  MorphiaLoggerFactory.reset()
  MorphiaLoggerFactory.registerLogger(classOf[SLF4JLogrImplFactory])

  override def beforeStart(app: play.api.Application): Unit = {
    Logger.info(s"[+] Preparing Toast Tk Web App environment..")
    val conf: play.api.Configuration = app.configuration
    val mongoUrl = conf.getString(KeyMongoDbUrl).getOrElse(throw new RuntimeException(s"$KeyMongoDbUrl is missing in your configuration"))
    Logger.info(s"[+] Connecting to mongoUrl: $mongoUrl")
    db = MongoConnector(mongoUrl)

    db match {
      case conn: MongoConnector => {
        Logger.info(s"[+] DB connection established..")
        ConnectionHolder.setDB(db)
      }
      case _ => Logger.error(s"[-] DB connection not established..")
    }
  }

  override def onStart(app: play.api.Application): Unit = {
    Logger.info(s"[+] Initializing DB settings...")
    db.init()
    db.loadDefaultConfiguration().map {
      configuration => configuration match {
        case None => {
          persistActionAdapters(None)
        }
        case Some(conf) => {
          persistActionAdapters(conf.id)
        }
      }
    }
  }

  private def persistActionAdapters(confId: Option[String]) = {
    var congifMap = Map[String, List[ConfigurationSyntax]]()
    val fixtureDescriptorList = DAOJavaWrapper.actionAdapterSentenceList
    for (descriptor <- fixtureDescriptorList) {
      val fixtureType: String = descriptor.fixtureType
      val fixtureName: String = descriptor.name
      val fixturePattern: String = descriptor.pattern
      val key = fixtureType +":"+fixtureName
      val newConfigurationSyntax: ConfigurationSyntax = ConfigurationSyntax(fixturePattern, fixturePattern, descriptor.description)
      val syntaxRows = congifMap.getOrElse(key, List[ConfigurationSyntax]())
      val newSyntaxRows =  newConfigurationSyntax :: syntaxRows
      congifMap = congifMap + (key -> newSyntaxRows)
    }
    val configurationRows = for ((k,v) <- congifMap) yield( ConfigurationRow(k.split(":")(0),k.split(":")(1),v) )
    db.saveConfiguration(MacroConfiguration(confId, "default", configurationRows.toList))
  }

  override def onStop(app: play.api.Application): Unit = {
    db.close()
  }

  override def onError(request: RequestHeader, throwable: Throwable) = {
    Future.successful(InternalServerError(
        views.html.error(new UsefulException(throwable.getMessage, throwable){
      })
    ))
  }

  override def onHandlerNotFound(request: RequestHeader) = {
    Future.successful(NotFound(views.html.notfound()))
  }

}