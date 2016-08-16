
import java.util.concurrent.TimeUnit

import akka.util.Timeout
import boot.AppBoot
import controllers.mongo.MongoConnector
import controllers.mongo.teams.Team
import controllers.mongo.users.User
import controllers.{UserController, InnerUserController}
import com.github.simplyscala.{MongodProps, MongoEmbedDatabase}
import org.junit.runner.RunWith
import org.scalatest.{BeforeAndAfterAll, BeforeAndAfter}
import org.scalatest.junit.JUnitRunner
import org.scalatestplus.play.PlaySpec
import de.flapdoodle.embed.mongo.distribution.Version
import play.api.libs.json.Json
import play.api.mvc.Controller
import play.api.test.{FakeApplication, Helpers, FakeRequest}
import scala.concurrent.duration.Duration
import scala.concurrent.{Await, Future}
import play.api.mvc._


@RunWith(classOf[JUnitRunner])
class UserControllerSpec extends PlaySpec
  with Results
  with MongoEmbedDatabase
  with BeforeAndAfterAll {

  class TestUserController extends Controller with InnerUserController
  var mongoProps: MongodProps = null
  implicit val timeout: Timeout = new Timeout(2, TimeUnit.SECONDS)

  override def beforeAll {
    mongoProps = mongoStart(27017, Version.V3_3_1)
    val connector: MongoConnector = MongoConnector()
    AppBoot.conn = connector;
    Await.ready(connector.init(), Duration.Inf).value.get
  }

  "UserController" should {
    "1: retrieve users in DB without their password" in {
        val controller = new TestUserController()
        val result: Future[Result] = controller.getAllUsers().apply(FakeRequest())
        val users = Helpers.contentAsJson(result).as[List[User]]
        users.length mustEqual 1
        users.head.password mustBe None
    }

    "2: retrieves default admin user" in {
      val controller = new TestUserController()
      val result: Future[Result] = controller.getAllUsers().apply(FakeRequest())
      val users = Helpers.contentAsJson(result).as[List[User]]
      users.head.login mustBe "admin"
    }

    "3: admin user is part of the default team" in {
      val controller = new TestUserController()
      val result: Future[Result] = controller.getAllUsers().apply(FakeRequest())
      val users = Helpers.contentAsJson(result).as[List[User]]
      users.length mustEqual 1
      val userTeams:List[Team] = users.head.teams.get
      userTeams.length mustEqual 1
      userTeams.head.name mustBe "default"
    }
  }

  override def afterAll {
    mongoStop(mongoProps)
  }
}
