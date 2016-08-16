
import java.util.concurrent.TimeUnit

import akka.util.Timeout
import boot.AppBoot
import controllers.mongo.MongoConnector
import controllers.{UserController, InnerUserController}
import com.github.simplyscala.{MongodProps, MongoEmbedDatabase}
import org.junit.runner.RunWith
import org.scalatest.BeforeAndAfter
import org.scalatest.junit.JUnitRunner
import org.scalatestplus.play.PlaySpec
import de.flapdoodle.embed.mongo.distribution.Version
import play.api.mvc.Controller
import play.api.test.{FakeApplication, Helpers, FakeRequest}
import play.test.{WithApplication, WithServer}
import scala.concurrent.Future
import play.api.mvc._


@RunWith(classOf[JUnitRunner])
class UserControllerSpec extends PlaySpec
  with Results
  with MongoEmbedDatabase
  with BeforeAndAfter {

  class TestUserController extends Controller with InnerUserController
  var mongoProps: MongodProps = null
  implicit val timeout: Timeout = new Timeout(2, TimeUnit.SECONDS)

  before {
    mongoProps = mongoStart(27017, Version.V3_3_1)
    AppBoot.conn = MongoConnector()

  }

  "UserController" should {
    "1: find an admin user in DB" in new WithApplication {
        AppBoot.onStart(null)
        val controller = new TestUserController()
        val result: Future[Result] = controller.getAllUsers().apply(FakeRequest())
        val json = Helpers.contentAsJson(result)
        println(json)
    }
  }

  after {
    AppBoot.onStop(null)
    mongoStop(mongoProps)
  }
}
