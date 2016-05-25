package controllers

import boot.AppBoot
import com.synaptix.toast.dao.domain.impl.report.{Project, Campaign}
import com.synaptix.toast.dao.domain.impl.test.block.ITestPage
import com.synaptix.toast.runtime.parse.TestParser
import controllers.mongo.Scenario
import play.api.libs.iteratee.Enumerator
import play.api.libs.json.{Json, JsError}
import play.api.mvc.{ResponseHeader, Result, Action, Controller}
import toast.engine.ToastRuntimeJavaWrapper
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.collection.immutable.StringOps
import com.synaptix.toast.runtime.report.HTMLReporter
import play.api.Logger
import reactivemongo.bson.BSONDocument
import scala.concurrent.duration.Duration
import scala.concurrent._
case class ScenarioWrapper(id: Option[String], name: Option[String], scenario: Option[Scenario])
case class Cpgn(id: Option[String], name: String, scenarii: List[ScenarioWrapper])
case class Prj(id: Option[String], name: String, iterations: Option[Short], campaigns: List[Cpgn])

object ProjectController  extends Controller {
  lazy val projectJavaDaoService = ToastRuntimeJavaWrapper.projectService
  implicit val sFormat = Json.format[ScenarioWrapper]
  implicit val campaignFormat = Json.format[Cpgn]
  implicit val projectFormat = Json.format[Prj]
 private val conn = AppBoot.conn
  /**
   * load to init projects
   */
  def loadProject() = Action {
    val projects = projectJavaDaoService.findAllReferenceProjects().iterator
    var prjs = List[Prj]()
    while (projects.hasNext()) {
      val project = projects.next()
      var cmpgs = List[Cpgn]()
      val campaigns = project.getCampaigns().iterator
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
      prjs = Prj(Some(project.getId().toString()), project.getName(), Some(project.getIteration()) , cmpgs) :: prjs
    }
    Ok(Json.toJson(prjs))
  }

  /**
   * Save project
   */
  def saveProject() = Action(parse.json) { implicit request =>
    val parser = new TestParser()

    def parseTestPage(scenario: Scenario, wikiScenario: String): ITestPage = {
      val testPage = parser.readString(wikiScenario, scenario.name)
      scenario.id match {
        case None => {}
        case Some(id) => testPage.setId(id)
      }
      testPage.setName(scenario.name)
      testPage
    }

    def transformCampaign(campaigns: List[Cpgn]): java.util.ArrayList[Campaign] = {
      val list = new java.util.ArrayList[Campaign]()
      for (cpgn <- campaigns) {
        val campaign = new Campaign()
        campaign.setName(cpgn.name)
        val testPagelist = new java.util.ArrayList[ITestPage]()
        val testPages = (for (c <- campaigns; wrapper <- c.scenarii) yield {

        Await.result(conn.findOneScenarioBy(BSONDocument(
          "name" -> wrapper.name.get
          )).map{
        case None => {
          println(s"[+] Scenario not found, could not saveProject !")
        }
        case Some(scenario) => {
    parseTestPage(scenario, ScenarioController.wikifiedScenario(scenario).as[String])
          }
        }, Duration.Inf).asInstanceOf[ITestPage]

         // parseTestPage(wrapper.scenario.get, ScenarioController.wikifiedScenario(wrapper.scenario.get).as[String])
        })
        for (tPage <- testPages) {
          testPagelist.add(tPage)
        }
        campaign.setTestCases(testPagelist)
        list.add(campaign)
      }
      list
    }
    def tranformProject(p: Prj): Project = {
      val project = new Project()
      project.setName(p.name)
      project.setCampaignsImpl(transformCampaign(p.campaigns))
      Logger.info(s"~~~~~~~~~~~~~~~~~~~~~~~~~~ {$project}")
      project
    }

    request.body.validate[Prj].map {
      case project: Prj => {
        projectJavaDaoService.saveReferenceProject(tranformProject(project))
        Ok("project saved !") 
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
      var p = projectJavaDaoService.getByNameAndIteration(pName, iter);
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
