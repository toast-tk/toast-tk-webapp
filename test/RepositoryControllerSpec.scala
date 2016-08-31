
import java.util.concurrent.TimeUnit

import akka.util.Timeout
import boot.AppBoot
import com.github.simplyscala.{MongoEmbedDatabase, MongodProps}
import controllers.mongo.{RepositoryImpl, MongoConnector}
import controllers.mongo.project.Project
import controllers.parsers.WebPageElement
import de.flapdoodle.embed.mongo.distribution.Version
import org.junit.runner.RunWith
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.junit.JUnitRunner
import org.scalatestplus.play.PlaySpec
import play.api.mvc._
import reactivemongo.bson.BSONDocument

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
    AppBoot.db = connector;
    Await.ready(connector.init(), Duration.Inf)
  }

  "RepositoryCollection" should {
    "1: returns only repository elements belonging to a project" in {
      val name: String = "Project"
      val project: Project = new Project(name)
      val reposFuture: Future[List[RepositoryImpl]] = for{
        res1 <- AppBoot.db.projectCollection.save(project)
        res2 <- {
          val repository = new RepositoryImpl(None, "repo", "web page", None, Some(res1))
          AppBoot.db.repositoryCollection.saveAutoConfiguration(repository)
        }
        res3 <- AppBoot.db.repositoryCollection.findProjectRepositories(res1)
      } yield res3

      val results: List[RepositoryImpl] = Await.result(reposFuture, Duration.Inf)
      results.length mustBe 1
      results.head.project.get.name mustEqual name
    }
  }

  override def afterAll {
    mongoStop(mongoProps)
  }
}
