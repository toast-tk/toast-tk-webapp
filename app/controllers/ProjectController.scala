package controllers

import com.synaptix.toast.dao.domain.impl.report.{Project, Campaign}
import com.synaptix.toast.dao.domain.impl.test.TestPage
import com.synaptix.toast.dao.report.ProjectHtmlReportGenerator
import com.synpatix.toast.runtime.core.parse.TestParser
import controllers.mongo.Scenario
import play.api.libs.iteratee.Enumerator
import play.api.libs.json.{Json, JsError}
import play.api.mvc.{ResponseHeader, SimpleResult, Action, Controller}
import toast.engine.ToastRuntimeJavaWrapper
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import scala.collection.immutable.StringOps

case class ScenarioWrapper(name: Option[String], scenario: Option[Scenario])
case class Cpgn(id: Option[String], name: String, scenarii: List[ScenarioWrapper])
case class Prj(id: Option[String], name: String, iterations: Option[Short], campaigns: List[Cpgn])

object ProjectController  extends Controller {
  lazy val projectJavaDaoService = ToastRuntimeJavaWrapper.projectService
  implicit val sFormat = Json.format[ScenarioWrapper]
  implicit val campaignFormat = Json.format[Cpgn]
  implicit val projectFormat = Json.format[Prj]

  /**
   * load to init projects
   */
  def loadProject() = Action {
    val projects = projectJavaDaoService.findAllLastProjects().iterator
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
          scns = ScenarioWrapper(Some(scenario.getPageName()), None) :: scns
        }
        cmpgs = Cpgn(Some(campaign.getId().toString()), campaign.getName(), scns) :: cmpgs
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

    def parseTestPage(scenario: Scenario, wikiScenario: String): TestPage = {
      val testPage = parser.parseString(wikiScenario)
      testPage.setName(scenario.name)
      testPage.setPageName(scenario.name)
      testPage
    }

    def transformCampaign(campaigns: List[Cpgn]): java.util.ArrayList[Campaign] = {
      val list = new java.util.ArrayList[Campaign]()
      for (cpgn <- campaigns) {
        val campaign = new Campaign()
        campaign.setName(cpgn.name)
        val testPagelist = new java.util.ArrayList[TestPage]()
        val testPages = (for (c <- campaigns; wrapper <- c.scenarii) yield parseTestPage(wrapper.scenario.get, ScenarioController.wikifiedScenario(wrapper.scenario.get).as[String]))
        for (tPage <- testPages) {
          testPagelist.add(tPage)
        }
        campaign.setTestCases(testPagelist)
        list.add(campaign)
      }

      list
    }
    def tranformProject(p: Prj): Project = {
      val pr = new Project()
      pr.setName(p.name)
      pr.setCampaigns(transformCampaign(p.campaigns))
      pr
    }

    request.body.validate[Prj].map {
      case project: Prj =>
        if(project.id.isDefined) {
          val javaProject = projectJavaDaoService.getLastByName(project.name)

        }
        else{
          projectJavaDaoService.saveNewIteration(tranformProject(project))
        }
        Ok("project saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }






  def loadProjectReport(name: String) = Action {
    val report = projectJavaDaoService.getProjectHTMLReport(name)
    SimpleResult( header = ResponseHeader(200, Map(CONTENT_TYPE -> "text/html")),
      body = Enumerator(new StringOps(report).getBytes()))
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
          val testPage =iteratorTestPage.next()
          if (testPage.getName().equals(tName)) {
            pageReport = ProjectHtmlReportGenerator.generatePageReport(null, testPage);
          }
        }
      }
      SimpleResult( header = ResponseHeader(200, Map(CONTENT_TYPE -> "text/html")),
        body = Enumerator(new StringOps(pageReport).getBytes()))
    }
  }


}
