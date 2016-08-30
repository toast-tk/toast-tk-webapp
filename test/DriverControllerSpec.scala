import java.util.concurrent.TimeUnit

import akka.util.Timeout
import boot.AppBoot
import com.github.simplyscala.{MongoEmbedDatabase, MongodProps}
import controllers.InnerUserController
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
class DriverControllerSpec extends PlaySpec
  with Results
  with ScalaFutures
  with MongoEmbedDatabase
  with BeforeAndAfterAll {


  class TestUserController extends Controller with InnerUserController
  var mongoProps: MongodProps = null
  implicit val timeout: Timeout = new Timeout(2, TimeUnit.SECONDS)

  override def beforeAll {
    mongoProps = mongoStart(27017, Version.V3_3_1)
    val connector: MongoConnector = MongoConnector()
    AppBoot.db = connector;
    Await.ready(connector.init(), Duration.Inf).value.get
  }

  "Driver Controller" should {
    "1: be able to find a user token project through db connector" in {
      val adminUser = Await.result(AppBoot.db.getAllUsers(), Duration.Inf)(0)
      adminUser.token must not be null
    }
  }

  override def afterAll {
    mongoStop(mongoProps)
  }
}
