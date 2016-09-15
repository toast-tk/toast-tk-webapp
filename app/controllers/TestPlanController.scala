package controllers

import java.util.concurrent.TimeUnit

import boot.AppBoot
import controllers.mongo.project.Project
import controllers.mongo.scenario.Scenario
import io.toast.tk.dao.domain.impl.report.{TestPlanImpl, Campaign}
import io.toast.tk.dao.domain.impl.test.block.ITestPage
import io.toast.tk.runtime.parse.TestParser
import play.api.libs.iteratee.Enumerator
import play.api.libs.json.{Json, JsError}
import play.api.mvc.{ResponseHeader, Result, Action, Controller}
import toast.engine.DAOJavaWrapper
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.collection.immutable.StringOps
import io.toast.tk.runtime.report.HTMLReporter
import play.api.Logger
import reactivemongo.bson.BSONDocument
import scala.concurrent.duration.Duration
import scala.concurrent._
import scala.collection.JavaConverters._



case class ScenarioWrapper(id: Option[String], name: Option[String], scenario: Option[Scenario])
case class Cpgn(id: Option[String], name: String, scenarii: List[ScenarioWrapper])
case class TestPlan(id: Option[String], name: String, iterations: Option[Short], campaigns: List[Cpgn], project: Option[Project])

object TestPlanController  extends Controller {
  lazy val testPlanService = DAOJavaWrapper.testPlanService
  lazy val projectService = DAOJavaWrapper.proectService
  val timeout = Duration(5, TimeUnit.SECONDS)
  implicit val sFormat = Json.format[ScenarioWrapper]
  implicit val campaignFormat = Json.format[Cpgn]
  implicit val testPlanFormat = Json.format[TestPlan]
  private val db = AppBoot.db

  /**
   * load to init test plan
   */
  def loadProject(idProject:String) = Action {
    val jTestPlans = testPlanService.findAllReferenceProjects(idProject).asScala
    var testPlans = List[TestPlan]()
    for(jTestPlan <- jTestPlans){
      var cmpgs = List[Cpgn]()
      val campaigns = jTestPlan.getCampaigns().iterator
      while (campaigns.hasNext()) {
        val campaign = campaigns.next()
        var scns = List[ScenarioWrapper]()
        val scenarii = campaign.getTestCases().iterator
        while (scenarii.hasNext()) {
          val scenario = scenarii.next()
          scns = ScenarioWrapper(Some(scenario.getIdAsString()),Some(scenario.getName()), None) :: scns
        }
        cmpgs = Cpgn(Some(campaign.getIdAsString()), campaign.getName(), scns.reverse) :: cmpgs
      }
      testPlans = TestPlan(
        Some(jTestPlan.getId().toString()),
        jTestPlan.getName(),
        Some(jTestPlan.getIteration()) ,
        cmpgs, None) :: testPlans
    }

    Ok(Json.toJson(testPlans))
  }

  /**
   * Save project
   */
  def saveProject() = Action(parse.json) { implicit request =>
    val parser = new TestParser()

    def parseTestPage(scenario: Scenario, wikiScenario: String): ITestPage = {
      val testPage = parser.readString(wikiScenario, scenario.name)
      scenario._id match {
        case None => {}
        case Some(id) => testPage.setId(id.stringify)
      }
      testPage.setName(scenario.name)
      testPage
    }

    def transformCampaign(project: Option[Project], campaigns: List[Cpgn]): java.util.ArrayList[Campaign] = {
      val list = new java.util.ArrayList[Campaign]()
      for (cpgn <- campaigns) {
        val campaign = new Campaign()
        campaign.setName(cpgn.name)
        val testPagelist = new java.util.ArrayList[ITestPage]()
        val testPages = (
          for (c <- campaigns; wrapper <- c.scenarii) yield {
                          Logger.info(s"[+] Trying to convert Scenario ${wrapper.scenario} !")
                          Await.result(db.findScenario(wrapper.name.get, project).map{
                          case None => {
                            Logger.info(s"[+] Scenario ${wrapper.scenario} not found, could not saveProject !")
                          }
                          case Some(scenario) => {
                              parseTestPage(scenario, ScenarioController.wikifiedScenario(scenario).as[String])
                            }
                          }, timeout).asInstanceOf[ITestPage]
        })
        for (tPage <- testPages) {
          testPagelist.add(tPage)
        }
        campaign.setTestCases(testPagelist)
        list.add(campaign)
      }
      list
    }
    def tranformProject(tp: TestPlan): TestPlanImpl = {
      val testPlan = new TestPlanImpl()
      testPlan.setName(tp.name)
      if(tp.project.isDefined){
        testPlan.setProject(projectService.findProject(tp.project.get._id.get.stringify))
      }
      testPlan.setCampaignsImpl(transformCampaign(tp.project, tp.campaigns))
      Logger.info(s"~~~~~~~~~~~~~~~~~~~~~~~~~~ {$testPlan}")
      testPlan
    }

    request.body.validate[TestPlan].map {
      case project: TestPlan => {
        testPlanService.saveTemplate(tranformProject(project))

        Ok("Test Plan saved !")
      }
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  def loadProjectReport(name: String) = Action {
    implicit request => {
    val report = HTMLReporter.getProjectHTMLReport(name)
    Result(header = ResponseHeader(200, Map(CONTENT_TYPE -> "text/html")),
                  body = Enumerator(new StringOps(report).getBytes()))
    }
  }

  def loadTestReport() = Action {
    implicit request => {
      val pName = request.queryString("project")(0);
      val iter = request.queryString("iteration")(0);
      val tName = request.queryString("test")(0);
      var p = testPlanService.getByNameAndIteration(pName, iter);
      var pageReport = ""
      val iteratorCampaign = p.getCampaigns().iterator
      while (iteratorCampaign.hasNext()) {
        val iteratorTestPage = iteratorCampaign.next().getTestCases().iterator
        while(iteratorTestPage.hasNext()){
          val testPage = iteratorTestPage.next()
          if (testPage.getName().equals(tName)) {
            pageReport = HTMLReporter.getTestPageHTMLReport(testPage);
          }
        }
      }
      Result( header = ResponseHeader(200, Map(CONTENT_TYPE -> "text/html")),
        body = Enumerator(new StringOps(pageReport).getBytes()))
    }
  }
}
