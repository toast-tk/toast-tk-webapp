
import java.util.concurrent.TimeUnit

import akka.util.Timeout
import boot.AppBoot
import com.github.simplyscala.{MongoEmbedDatabase, MongodProps}
import controllers.mongo.MongoConnector
import controllers.mongo.project.Project
import de.flapdoodle.embed.mongo.distribution.Version
import org.junit.runner.RunWith
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.junit.JUnitRunner
import org.scalatestplus.play.PlaySpec
import play.api.mvc._

import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future}

@RunWith(classOf[JUnitRunner])
class RepositoryControllerSpec extends PlaySpec
  with Results
  with ScalaFutures
  with MongoEmbedDatabase
  with BeforeAndAfterAll {

  var mongoProps: MongodProps = null
  implicit val timeout: Timeout = new Timeout(2, TimeUnit.SECONDS)

  override def beforeAll {
    mongoProps = mongoStart(27017, Version.V3_3_1)
    val connector: MongoConnector = MongoConnector()
    AppBoot.conn = connector;
    Await.ready(connector.init(), Duration.Inf).value.get
  }

  "RepositoryCollection" should {
    "1: save a repository with a project" in {
        val project:Project = new Project(name = "Project")
        val future: Future[Project] = AppBoot.conn.projectCollection.save(project)
        whenReady(future) {
          result => {
            result._id must not be None
          }
        }
    }

    "2: list only repository elements belonging to a project" in {
      val future: Future[List[Project]] = AppBoot.conn.projectCollection.list()
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
