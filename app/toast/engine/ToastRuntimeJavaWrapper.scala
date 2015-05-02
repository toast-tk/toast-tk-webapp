package toast.engine


import com.synaptix.toast.adapter._
import com.synaptix.toast.dao.guice.MongoModule
import com.synaptix.toast.dao.service.dao.access.project.ProjectDaoService
import com.synaptix.toast.dao.service.dao.access.repository.RepositoryDaoService
import scala.collection.JavaConverters._

object ToastRuntimeJavaWrapper {

  //FIXME pass to the injector the proper mongo db host
  private lazy val injector = com.google.inject.Guice.createInjector(new MongoModule());
  lazy val projectService = injector.getInstance(classOf[ProjectDaoService.Factory])create("test_project_db");
  lazy val repositoryDaoService = injector.getInstance(classOf[RepositoryDaoService.Factory])create("play_db");

  def actionAdapterSentenceList = {
    val fixtureDescriptorList = ActionAdapterCollector.listAvailableSentences().asScala
    fixtureDescriptorList
  }

}
