package toast.engine

import io.toast.tk.dao.service.dao.access.test.TestPageDaoService
import play.api.Play
import play.api.Logger
import io.toast.tk.adapter._
import io.toast.tk.dao.guice.MongoModule
import io.toast.tk.runtime.dao.DAOManager
import io.toast.tk.dao.service.dao.access.plan.TestPlanDaoService
import io.toast.tk.dao.service.dao.access.repository.{ProjectDaoService, RepositoryDaoService}
import io.toast.tk.dao.service.dao.access.team.UserDaoService
import io.toast.tk.dao.service.dao.access.team.TeamDaoService
import scala.collection.JavaConverters._
import com.mongodb.MongoCredential
import reactivemongo.api.MongoConnection
import com.typesafe.config.ConfigFactory
import scala.concurrent.Future
import scala.concurrent.ExecutionContext.Implicits.global
import com.google.inject.Guice
import reactivemongo.api.MongoConnection.ParsedURI
import scala.concurrent.duration.Duration
import java.util.concurrent.TimeUnit
import scala.concurrent.{Await}
import reactivemongo.core.nodeset.Authenticate

object DAOJavaWrapper {

  val mongoUri = ConfigFactory.load().getString("mongo.db.url")

  val timeout = Duration(15, TimeUnit.SECONDS)

  val connectionParams = for {
    parsedUri <- Future.fromTry(MongoConnection.parseURI(mongoUri))
  } yield parsedUri

  val module:Future[MongoModule] = connectionParams.map {
      result => result match {
          case params:ParsedURI => {
            val mongoDBHost = params.hosts(0)._1
            val mongoDBPort = params.hosts(0)._2
            val mongoUserDB = params.db.getOrElse("play_db")
            val credential: MongoCredential = params.authenticate.get match {
              case auth:Authenticate => {
                MongoCredential.createMongoCRCredential(auth.user, mongoUserDB, auth.password.toCharArray())
              }
              case _ => null
            }
            DAOManager.init(mongoDBHost, mongoDBPort, mongoUserDB, credential) 
            new MongoModule(mongoDBHost, mongoDBPort, mongoUserDB, credential)
          }
          case _ => {
            throw new RuntimeException(s"[-] mongo.db.url couldn't be parsed: $mongoUri")
          } 
      } 
  }

  val mongoUserDB:String = Await.result(connectionParams,timeout).db.get

  private lazy val injector = Guice.createInjector(Await.result(module, timeout))
  lazy val testPlanService = injector.getInstance(classOf[TestPlanDaoService.Factory])create(mongoUserDB)
  lazy val testPageService = injector.getInstance(classOf[TestPageDaoService.Factory])create(mongoUserDB)
  lazy val repositoryDaoService = injector.getInstance(classOf[RepositoryDaoService.Factory])create(mongoUserDB)
  lazy val userDaoService = injector.getInstance(classOf[UserDaoService.Factory])create(mongoUserDB)
  lazy val teamDaoService = injector.getInstance(classOf[TeamDaoService.Factory])create(mongoUserDB)
  lazy val proectService = injector.getInstance(classOf[ProjectDaoService.Factory])create(mongoUserDB)
  def actionAdapterSentenceList = {
    val fixtureDescriptorList = ActionAdapterCollector.listAvailableSentences().asScala
    fixtureDescriptorList
  }

}
