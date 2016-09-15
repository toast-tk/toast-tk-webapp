package toast.engine

import play.api.Play
import io.toast.tk.adapter._
import io.toast.tk.dao.guice.MongoModule
import io.toast.tk.runtime.dao.DAOManager
import io.toast.tk.dao.service.dao.access.plan.TestPlanDaoService
import io.toast.tk.dao.service.dao.access.repository.{ProjectDaoService, RepositoryDaoService}
import io.toast.tk.dao.service.dao.access.team.UserDaoService
import io.toast.tk.dao.service.dao.access.team.TeamDaoService
import scala.collection.JavaConverters._

object DAOJavaWrapper {

  val toast_db = "play_db";
  val toast_test_execution_history_db = "test_project_db";
  val mongoDBHost = Play.maybeApplication match {
    case Some(app) => app.configuration.getString("db.mongo.host").getOrElse("localhost")
    case _ => "localhost"
  }
  val mongoDBPort = Play.maybeApplication match {
    case Some(app) => app.configuration.getInt("db.mongo.port").getOrElse(27017)
    case _ => 27017
  }
  DAOManager.init(mongoDBHost, mongoDBPort) //init db connection parameters for the reporter
  private lazy val injector = com.google.inject.Guice.createInjector(new MongoModule(mongoDBHost,mongoDBPort));
  lazy val testPlanService = injector.getInstance(classOf[TestPlanDaoService.Factory])create(toast_test_execution_history_db);
  lazy val repositoryDaoService = injector.getInstance(classOf[RepositoryDaoService.Factory])create(toast_db);
  lazy val userDaoService = injector.getInstance(classOf[UserDaoService.Factory])create(toast_db);
  lazy val teamDaoService = injector.getInstance(classOf[TeamDaoService.Factory])create(toast_db);
  lazy val proectService = injector.getInstance(classOf[ProjectDaoService.Factory])create(toast_db);
  def actionAdapterSentenceList = {
    val fixtureDescriptorList = ActionAdapterCollector.listAvailableSentences().asScala
    fixtureDescriptorList
  }

}
