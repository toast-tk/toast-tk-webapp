package boot

import com.mongo.test.service.dao.access.project._
import com.mongo.test.guice._

object Global extends play.api.GlobalSettings {

	private val injector = com.google.inject.Guice.createInjector(new MongoModule());
	val projectService = injector.getInstance(classOf[ProjectDaoService.Factory])create("test_project_db");
	
	override def beforeStart(app: play.api.Application): Unit = {
		println("Application Successfully started...")
	}
}