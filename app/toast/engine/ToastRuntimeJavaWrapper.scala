package toast.engine

import play.api.Play
import com.synaptix.toast.adapter._
import com.synaptix.toast.dao.guice.MongoModule
import com.synaptix.toast.runtime.dao.DAOManager
import com.synaptix.toast.dao.service.dao.access.project.ProjectDaoService
import com.synaptix.toast.dao.service.dao.access.repository.RepositoryDaoService
import scala.collection.JavaConverters._

object ToastRuntimeJavaWrapper {

  val mongoDBHost = Play.current.configuration.getString("db.mongo.host").getOrElse("10.23.252.131")
  val mongoDBPort = Play.current.configuration.getInt("db.mongo.port").getOrElse(27017)
  DAOManager.getInstance(mongoDBHost, mongoDBPort) //init db connection parameters for the reporter
  private lazy val injector = com.google.inject.Guice.createInjector(new MongoModule(mongoDBHost,mongoDBPort));
  lazy val projectService = injector.getInstance(classOf[ProjectDaoService.Factory])create("test_project_db");
  lazy val repositoryDaoService = injector.getInstance(classOf[RepositoryDaoService.Factory])create("play_db");

  def actionAdapterSentenceList = {
    val fixtureDescriptorList = ActionAdapterCollector.listAvailableSentences().asScala
    fixtureDescriptorList
  }

}
