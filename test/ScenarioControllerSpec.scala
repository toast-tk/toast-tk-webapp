import java.util.concurrent.TimeUnit

import akka.util.Timeout
import boot.AppBoot
import com.github.simplyscala.{MongoEmbedDatabase, MongodProps}
import controllers.mongo.MongoConnector
import controllers.mongo.project.Project
import controllers.mongo.scenario.{Scenario, ScenarioCollection}
import de.flapdoodle.embed.mongo.distribution.Version
import org.junit.runner.RunWith
import org.scalatest.BeforeAndAfterAll
import org.scalatest.concurrent.ScalaFutures
import org.scalatest.junit.JUnitRunner
import org.scalatestplus.play.PlaySpec
import play.api.libs.json.{Json, JsObject, JsArray, JsString}
import play.api.mvc._

import scala.concurrent.Await
import scala.concurrent.duration.Duration
import scala.concurrent.ExecutionContext.Implicits.global

@RunWith(classOf[JUnitRunner])
class ScenarioControllerSpec extends PlaySpec
  with Results
  with ScalaFutures
  with MongoEmbedDatabase
  with BeforeAndAfterAll {

  var mongoProps: MongodProps = null
  implicit val timeout: Timeout = new Timeout(2, TimeUnit.SECONDS)
  var myProject: Project = null
  var myProject2: Project = null

  override def beforeAll {
    mongoProps = mongoStart(27017, Version.V3_3_1)
    val connector: MongoConnector = MongoConnector()
    AppBoot.conn = connector;
    Await.ready(connector.init(), Duration.Inf)
    myProject = Await.result(connector.projectCollection.save(new Project(name = "Project")), Duration.Inf)
    myProject2 = Await.result(connector.projectCollection.save(new Project(name = "Project2")), Duration.Inf)
  }

  "ScenarioCollection" should {
    "1: save a scenario with no ID" in {
      val collection:ScenarioCollection = AppBoot.conn.scenarioCollection
      val newScenario = new Scenario(name="scenario", `type`="web", driver="", project = Some(myProject))
      val result: Scenario = Await.result(collection.save(newScenario), Duration.Inf)
      val jsonId: JsString = ((Json.toJson(result).as[JsObject]) \ "_id").as[JsString]
      jsonId.value mustEqual result._id.get.stringify
    }

    "2: upsert a scenario with ID" in {
      val collection:ScenarioCollection = AppBoot.conn.scenarioCollection
      val newScenario = new Scenario(name="scenario", `type`="web", driver="", project = Some(myProject))
      Await.ready(collection.save(newScenario), Duration.Inf)
      val updatedScenario = new Scenario(name="scenario", `type`="web", driver="update", project = Some(myProject), _id=newScenario._id)
      Await.ready(collection.save(updatedScenario), Duration.Inf)
      val result: Option[Scenario] = Await.result(collection.one(newScenario._id.get.stringify), Duration.Inf)
      result.isDefined mustBe true
      result.get.driver mustEqual "update"
    }

    "3: find a scenario by name and project" in {
      val collection:ScenarioCollection = AppBoot.conn.scenarioCollection
      val scenario1 = new Scenario(name="scenario", `type`="web", driver="", project = Some(myProject))
      Await.ready(collection.save(scenario1), Duration.Inf)
      val scenario2 = new Scenario(name="scenario", `type`="web", driver="", project = Some(myProject2))
      Await.ready(collection.save(scenario2), Duration.Inf)
      val result: Option[Scenario] = Await.result(collection.findProjectScenario("scenario", scenario2.project), Duration.Inf)
      result.isDefined mustBe true
      result.get mustEqual scenario2
      result.get must not be scenario1
    }
  }

  override def afterAll {
    mongoStop(mongoProps)
  }
}
