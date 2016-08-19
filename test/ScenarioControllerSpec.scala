import java.util.concurrent.TimeUnit

import akka.util.Timeout
import boot.AppBoot
import controllers.mongo.MongoConnector
import de.flapdoodle.embed.mongo.distribution.Version
import org.junit.runner.RunWith
import play.api.mvc._

import scala.concurrent.Await
import scala.concurrent.duration.Duration

@RunWith(classOf[JUnitRunner])
class ScenarioControllerSpec extends PlaySpec
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
    Await.ready(connector.init(), Duration.Inf)
  }

  "ScenarioCollection" should {
    "1: save a scenario with not ID" in {

    }

    "2: upsert a scenario with ID" in {

    }
  }

  override def afterAll {
    mongoStop(mongoProps)
  }
}
