
import java.util.concurrent.TimeUnit

import akka.util.Timeout
import boot.AppBoot
import com.github.simplyscala.{MongoEmbedDatabase, MongodProps}
import controllers.mongo.MongoConnector
import controllers.mongo.project.Project
import de.flapdoodle.embed.mongo.distribution.Version
import org.junit.runner.RunWith
import org.scalatest.BeforeAndAfterAll
import org.scalatest.junit.JUnitRunner
import org.scalatestplus.play.PlaySpec
import play.api.mvc.{Controller, _}
import play.api.test.{FakeRequest, Helpers}
import org.scalatest.concurrent.ScalaFutures

import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future}


import scala.concurrent.ExecutionContext.Implicits.global

@RunWith(classOf[JUnitRunner])
class ProjectControllerSpec extends PlaySpec
  with Results
  with ScalaFutures
  with MongoEmbedDatabase
  with BeforeAndAfterAll {

  var mongoProps: MongodProps = null
  implicit val timeout: Timeout = new Timeout(2, TimeUnit.SECONDS)

  override def beforeAll {
    mongoProps = mongoStart(27017, Version.V3_3_1)
    val connector: MongoConnector = MongoConnector()
    AppBoot.db = connector;
    Await.ready(connector.init(), Duration.Inf).value.get
  }

  "ProjectCollection" should {
    "1: save project" in {
        val project:Project = new Project(name = "Project")
        val future: Future[Project] = AppBoot.db.projectCollection.save(project)
        whenReady(future) {
          result => {
            result._id must not be None
          }
        }
    }

    "2: list all projects" in {
      val future: Future[List[Project]] = AppBoot.db.projectCollection.list()
      whenReady(future) {
        result => {
          result.length mustEqual 1
          result.head.name mustEqual "Project"
        }
      }
    }
  }

  override def afterAll {
    mongoStop(mongoProps)
  }
}
