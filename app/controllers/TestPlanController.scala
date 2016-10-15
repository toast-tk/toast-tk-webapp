package controllers

import java.util.concurrent.TimeUnit

import boot.{JwtProtected, AppBoot}
import controllers.mongo.project.Project
import controllers.mongo.scenario.Scenario
import io.toast.tk.dao.domain.impl.report.{TestPlanImpl, Campaign}
import io.toast.tk.dao.domain.impl.test.block.ITestPage
import io.toast.tk.dao.service.dao.access.test.TestPageFromProxy
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



case class ScenarioWrapper(id: Option[String], name: Option[String], idScenario: Option[String])
case class Cpgn(id: Option[String], name: String, scenarii: List[ScenarioWrapper])
case class TestPlan(id: Option[String], name: String, iterations: Option[Short], campaigns: List[Cpgn], project: Option[Project])

object TestPlanController  extends Controller {
  lazy val testPlanService = DAOJavaWrapper.testPlanService
  lazy val testPageService = DAOJavaWrapper.testPageService
  lazy val projectService = DAOJavaWrapper.proectService
  val timeout = Duration(5, TimeUnit.SECONDS)
  implicit val sFormat = Json.format[ScenarioWrapper]
  implicit val campaignFormat = Json.format[Cpgn]
  implicit val testPlanFormat = Json.format[TestPlan]
  private val db = AppBoot.db

  /**
   * load to init test plan
   */
  @JwtProtected
  def loadProject(idProject:String) = Action {
    val jTestPlans = testPlanService.findAllReferenceProjects(idProject).asScala
    var testPlans = List[TestPlan]()
    for(jTestPlan <- jTestPlans){
      var cmpgs = List[Cpgn]()
      val campaigns = jTestPlan.getCampaigns().iterator
      while (campaigns.hasNext()) {
        val campaign = campaigns.next()
        var scns = List[ScenarioWrapper]()
        val testPages = campaign.getTestCases().iterator
        while (testPages.hasNext()) {
          val testPage = testPages.next()
          val maybeIdScenario = if (testPage.getIdScenario() == null) None else Some(testPage.getIdScenario())
          scns = ScenarioWrapper(Some(testPage.getIdAsString()),Some(testPage.getName()), maybeIdScenario) :: scns
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
  @JwtProtected
  def saveProject() = Action(parse.json) { implicit request =>
    val parser = new TestParser()

    def parseTestPage(idSourceScenario: String, idTestPage: Option[String], scenario: Scenario, wikiScenario: String): ITestPage = {
      val testPage:ITestPage = parser.readString(wikiScenario, scenario.name)
      idTestPage match {
        case None => {}
        case Some(id) => testPage.setId(id)
      }
      testPage.setName(scenario.name)
      testPage.setIdScenario(idSourceScenario)
      testPage
    }

    def transformCampaign(project: Option[Project], campaigns: List[Cpgn]): java.util.ArrayList[Campaign] = {
      val list = new java.util.ArrayList[Campaign]()
      for (cpgn <- campaigns) {
        val campaign = new Campaign()
        campaign.setName(cpgn.name)
        val testPageList = new java.util.ArrayList[ITestPage]()
        val testPages:List[Option[ITestPage]] = for (wrapper <- cpgn.scenarii) yield {
            wrapper.idScenario match {
              case None => {
                Await.result(db.findScenario(wrapper.name.get, project).map{
                  case None => {
                    Logger.info(s"[+] Scenario @name(${wrapper.name}) with @idScenario(${wrapper.idScenario})!")
                    Logger.info(s"[+] Trying to find test page @name(${wrapper.name}) with @id(${wrapper.id})..")
                    wrapper.id match{
                      case Some(id) => {
                          val maybeTestPage = testPageService.getById(id)
                          val resultPage:Option[ITestPage] = maybeTestPage match {
                            case null => {
                              Logger.info(s"[+] No test page found with @id(${id})")
                              None
                            }
                            case iTestPage => {
                              Logger.info(s"[+] Found test page @name(${iTestPage.getName()}) with @id(${iTestPage.getIdAsString()})")
                              Some(iTestPage)
                            }
                          }
                          resultPage
                        }
                        case None => {
                          Logger.info(s"[+] Scenario @name(${wrapper.name}) with @idScenario(${wrapper.idScenario}) not found !")
                          None
                        }
                      }
                    }
                    case Some(scenario) => {
                      val idScenario = scenario._id.get.stringify
                      Some(parseTestPage(idScenario, wrapper.id, scenario, ScenarioController.wikifiedScenario(scenario).as[String]))
                    }
                }, timeout)
              }
              case Some(idScenario) => {
                Await.result(db.findScenarioById(idScenario).map{
                  case None => {
                    Logger.info(s"[+] Scenario @name(${wrapper.name}) with @idScenario(${idScenario}) not found !")
                    None
                  }
                  case Some(scenario) => {
                    val idScenario = wrapper.idScenario.get
                    Some(parseTestPage(idScenario, wrapper.id, scenario, ScenarioController.wikifiedScenario(scenario).as[String]))
                  }
                }, timeout)
              }
            }
        }
        val resultPages = testPages.filter(item => !item.equals(None))
        for (maybePage <- resultPages)  {
          Logger.info(s"[+] Add @name(${maybePage.get.getName()}) with @idScenario(${maybePage.get.getIdScenario()}) and @id(${maybePage.get.getIdAsString()}}) !")
          testPageList.add(maybePage.get)
        }
        campaign.setTestCases(testPageList)
        list.add(campaign)
      }
      list
    }

    def tranformTestPlan(tp: TestPlan): TestPlanImpl = {
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
      case testPlan: TestPlan => {
        testPlan.id match {
          case None => {
            testPlanService.saveTemplate(tranformTestPlan(testPlan))
            Ok("Test Plan saved !")
          }
          case Some(id) => {
            testPlanService.updateTemplateFromTestPlan(tranformTestPlan(testPlan))
            Ok("Test Plan updated !")
          }
        }
      }
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  @JwtProtected
  def loadProjectReport(name: String) = Action {
    implicit request => {
    val report = HTMLReporter.getProjectHTMLReport(name)
    Result(header = ResponseHeader(200, Map(CONTENT_TYPE -> "text/html")),
                  body = Enumerator(new StringOps(report).getBytes()))
    }
  }

  @JwtProtected
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
