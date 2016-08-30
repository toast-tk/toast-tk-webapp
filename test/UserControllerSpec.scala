
import java.util.concurrent.TimeUnit

import akka.util.Timeout
import boot.AppBoot
import controllers.mongo.MongoConnector
import controllers.mongo.project.Project
import controllers.mongo.teams.Team
import controllers.mongo.users.User
import controllers.{UserController, InnerUserController}
import com.github.simplyscala.{MongodProps, MongoEmbedDatabase}
import org.junit.runner.RunWith
import org.scalatest.{BeforeAndAfterAll, BeforeAndAfter}
import org.scalatest.junit.JUnitRunner
import org.scalatestplus.play.PlaySpec
import de.flapdoodle.embed.mongo.distribution.Version
import play.api.libs.json.{JsObject, Json}
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
    AppBoot.db = connector;
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

    "4: admin user is part of the default team having one default project" in {
      val controller = new TestUserController()
      val userResult: Future[Result] = controller.getAllUsers().apply(FakeRequest())
      val idUser = Helpers.contentAsJson(userResult).as[List[User]].head._id.get.stringify
      val projectResult: Future[Result] = controller.getUserProjects(idUser).apply(FakeRequest())
      val projects = Helpers.contentAsJson(projectResult).as[List[JsObject]]
      projects.length mustEqual 1
      (projects(0) \ "project" \ "name").as[String] mustBe "default"
    }


  }

  override def afterAll {
    mongoStop(mongoProps)
  }
}
