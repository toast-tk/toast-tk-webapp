package toast.engine

import io.toast.tk.dao.service.dao.access.test.TestPageDaoService
import play.api.Play
import io.toast.tk.adapter._
import io.toast.tk.dao.guice.MongoModule
import io.toast.tk.runtime.dao.DAOManager
import io.toast.tk.dao.service.dao.access.plan.TestPlanDaoService
import io.toast.tk.dao.service.dao.access.repository.{ProjectDaoService, RepositoryDaoService}
import io.toast.tk.dao.service.dao.access.team.UserDaoService
import io.toast.tk.dao.service.dao.access.team.TeamDaoService
import scala.collection.JavaConverters._
import com.mongodb.MongoCredential

object DAOJavaWrapper {

  val mongoDBHost = Play.maybeApplication match {
    case Some(app) => app.configuration.getString("db.mongo.host").getOrElse("localhost")
    case _ => "localhost"
  }
  val mongoDBPort = Play.maybeApplication match {
    case Some(app) => app.configuration.getInt("db.mongo.port").getOrElse(27017)
    case _ => 27017
  }
  val credential: MongoCredential = Play.maybeApplication match {
    case Some(app) => {
      val userName:String = app.configuration.getString("db.mongo.user").get
      val password:String = app.configuration.getString("db.mongo.pwd").get
      val userDB:String = app.configuration.getString("db.mongo.userDb").get
      MongoCredential.createMongoCRCredential(userName, userDB, password.toCharArray())
    }
    case _ => null
  }
  val mongoUserDB: String = Play.maybeApplication match {
    case Some(app) => app.configuration.getString("db.mongo.userDb").getOrElse("test_project_db")
    case _ => "test_project_db"
  }


  DAOManager.init(mongoDBHost, mongoDBPort, mongoUserDB, credential) //init db connection parameters for the reporter

  private lazy val injector = com.google.inject.Guice.createInjector(new MongoModule(mongoDBHost, mongoDBPort, mongoUserDB, credential));
  lazy val testPlanService = injector.getInstance(classOf[TestPlanDaoService.Factory])create(mongoUserDB);
  lazy val testPageService = injector.getInstance(classOf[TestPageDaoService.Factory])create(mongoUserDB);
  lazy val repositoryDaoService = injector.getInstance(classOf[RepositoryDaoService.Factory])create(mongoUserDB);
  lazy val userDaoService = injector.getInstance(classOf[UserDaoService.Factory])create(mongoUserDB);
  lazy val teamDaoService = injector.getInstance(classOf[TeamDaoService.Factory])create(mongoUserDB);
  lazy val proectService = injector.getInstance(classOf[ProjectDaoService.Factory])create(mongoUserDB);
  def actionAdapterSentenceList = {
    val fixtureDescriptorList = ActionAdapterCollector.listAvailableSentences().asScala
    fixtureDescriptorList
  }

}
