package controllers

import java.net.URLDecoder
import java.text.SimpleDateFormat
import java.util.concurrent.TimeUnit
import boot.{JwtProtected, AppBoot}
import controllers.mongo.project.Project
import controllers.mongo.scenario.Scenario
import io.toast.tk.dao.domain.api.test.ITestResult.ResultKind
import io.toast.tk.dao.domain.impl.report.{TestPlanImpl, Campaign}
import io.toast.tk.dao.domain.impl.test.block.line.TestLine
import io.toast.tk.dao.domain.impl.test.block._
import io.toast.tk.runtime.parse.TestParser
import play.api.libs.json.{JsValue, Json, JsError}
import play.api.mvc.{Action, Controller}
import play.json.extra.{Variants, JsonFormat}
import toast.engine.DAOJavaWrapper
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.Logger
import scala.collection.mutable
import scala.concurrent.duration.Duration
import scala.concurrent._
import scala.collection.JavaConverters._



case class TestLineMirror(test:String,
                          expected:String,
                          testResultKind:String,
                          testResult: String,
                          contextualSentence: String,
                          comment: String,
                          screenshot: Option[String] = None,
                          executionTime: Long)

case class TestPageBlockMirror(fixtureName: String,
                               technicalErrorNumber: Int,
                               testSuccessNumber: Int,
                               testFailureNumber: Int,
                               blockLines: List[TestLineMirror])

case class TestPageMirror(id: Option[String],
                          name: Option[String],
                          idScenario: Option[String],
                          executionTime: Long,
                          technicalErrorNumber: Int,
                          testFailureNumber: Int,
                          testSuccessNumber: Int,
                          isPreviousIsSuccess: Boolean,
                          previousExecutionTime: Long,
                          isSuccess: Boolean,
                          isFatal: Boolean,
                          blocks: List[TestPageBlockMirror])

case class CampaignMirror(id: Option[String],
                          name: String,
                          scenarii: List[TestPageMirror])

case class TestPlanMirror(id: Option[String],
                          name: String,
                          iterations: Option[Short],
                          campaigns: List[CampaignMirror],
                          creationDate: String,
                          project: Option[Project] = None)

object TestLineMirror{
  def from(line: TestLine): TestLineMirror = {
    val testResultKind = if(line.getTestResult() == null) "None" else getResultKindAsString(line.getTestResult().getResultKind())
    val testResult = if(line.getTestResult() == null) "None" else line.getTestResult().getMessage()
    val sentence = if(line.getTestResult() == null) line.getTest() else line.getTestResult().getContextualTestSentence()
    val screenshot = if(line.getTestResult == null) None else if (line.getTestResult().getScreenShot() == null) None else Some(line.getTestResult().getScreenShot())
    new TestLineMirror(line.getTest(),
      line.getExpected(),
      testResultKind,
      testResult,
      line.getComment(),
      sentence,
      screenshot,
      line.getExecutionTime())
  }

  private def getResultKindAsString(resultKind: ResultKind):String = {
    if(ResultKind.SUCCESS.equals(resultKind)) {
      "success"
    }
    else if(ResultKind.ERROR.equals(resultKind)) {
      "warning"
    }
    else if(ResultKind.FAILURE.equals(resultKind)) {
      "danger"
    }
    else if(ResultKind.INFO.equals(resultKind)) {
      "info"
    }else {
      ""
    }
  }
}

object TestPageBlockMirror {
  def from(block:TestBlock): TestPageBlockMirror = {
    var lines = for(line <- block.getBlockLines().asScala) yield (TestLineMirror.from(line))
    new TestPageBlockMirror(block.getFixtureName(),
      block.getTechnicalErrorNumber(),
      block.getTestSuccessNumber(),
      block.getTestFailureNumber(),
      lines.toList
    )
  }
}

object TestPageMirror {
  def from(testPage: ITestPage): TestPageMirror = {
    val maybeId = if (testPage.getIdScenario() == null) None else Some(testPage.getIdScenario())
    def getBlocks(blocks: List[IBlock]): List[TestPageBlockMirror] = {
      blocks match {
        case x :: xs  => {
          x match {
            case b: TestBlock => {
              TestPageBlockMirror.from(b) :: getBlocks(xs)
            }
            case b: ITestPage => {
              getBlocks(b.getBlocks().asScala.toList) ++ getBlocks(xs)
            }
            case _ => getBlocks(xs)
          }
        }
        case Nil => List()
      }

    }

    val blocks = testPage.getBlocks().asScala.toList
    val flattenedBlocks = getBlocks(blocks).reverse
    new TestPageMirror(
      Some(testPage.getIdAsString()),
      Some(testPage.getName()),
      maybeId,
      testPage.getExecutionTime(),
      testPage.getTechnicalErrorNumber(),
      testPage.getTestFailureNumber(),
      testPage.getTestSuccessNumber(),
      testPage.isPreviousIsSuccess(),
      testPage.getPreviousExecutionTime(),
      testPage.isSuccess(),
      testPage.isFatal(),
      flattenedBlocks
    )
  }
}

object CampaignMirror {
  def from(campaign: ICampaign):CampaignMirror = {
    var scenarios = List[TestPageMirror]()
    for (testPage <- campaign.getTestCases.asScala) {
      scenarios = TestPageMirror.from(testPage) :: scenarios
    }
    new CampaignMirror(Some(campaign.getIdAsString()), campaign.getName(), scenarios.reverse)
  }
}

object TestPlanMirror{
  def from(testPlanImpl: TestPlanImpl):TestPlanMirror = {
    var campaignsMirror = List[CampaignMirror]()
    val campaigns = testPlanImpl.getCampaigns().asScala
    for (campaign <- campaigns) {
      campaignsMirror = CampaignMirror.from(campaign) :: campaignsMirror
    }
    val format = new SimpleDateFormat("dd/MM/yyyy hh:mm")
    new TestPlanMirror(Some(testPlanImpl.getId().toString()),
      testPlanImpl.getName(),
      Some(testPlanImpl.getIteration()),
      campaignsMirror,
      format.format(testPlanImpl.getCreationDate())
    )
  }
}

object TestPlanController  extends Controller {
  lazy val testPlanService = DAOJavaWrapper.testPlanService
  lazy val testPageService = DAOJavaWrapper.testPageService
  lazy val projectService = DAOJavaWrapper.proectService
  val timeout = Duration(5, TimeUnit.SECONDS)

  implicit val testLineFormat = Json.format[TestLineMirror]
  implicit val testPageBlockFormat = Json.format[TestPageBlockMirror]
  implicit val testPageFormat = Json.format[TestPageMirror]
  implicit val campaignFormat = Json.format[CampaignMirror]
  implicit val testPlanFormat = Json.format[TestPlanMirror]
  private val db = AppBoot.db

  /**
   * load to init test plans
   */
  @JwtProtected
  def loadProject(idProject:String) = Action {
    val jTestPlans = testPlanService.findAllReferenceProjects(idProject).asScala
    var testPlans = List[TestPlanMirror]()
    for(jTestPlan <- jTestPlans){
      testPlans = TestPlanMirror.from(jTestPlan) :: testPlans
    }
    Ok(Json.toJson(testPlans))
  }

  @JwtProtected
  def loadTestPlanSetup(idTestPlan: String) = Action {
    val jTestPlan:TestPlanImpl = testPlanService.findTestPlanById(idTestPlan)
    Ok(Json.toJson(TestPlanMirror.from(jTestPlan)))
  }

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

    def transformCampaign(project: Option[Project], campaigns: List[CampaignMirror]): java.util.ArrayList[Campaign] = {
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

    def tranformTestPlan(tp: TestPlanMirror): TestPlanImpl = {
      val testPlan = new TestPlanImpl()
      testPlan.setName(tp.name)
      if(tp.project.isDefined){
        testPlan.setProject(projectService.findProject(tp.project.get._id.get.stringify))
      }
      testPlan.setCampaignsImpl(transformCampaign(tp.project, tp.campaigns))
      Logger.info(s"~~~~~~~~~~~~~~~~~~~~~~~~~~ {$testPlan}")
      testPlan
    }

    request.body.validate[TestPlanMirror].map {
      case testPlan: TestPlanMirror => {
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
      val testPlanName = URLDecoder.decode(name, "UTF-8")
      val testPlan:TestPlanImpl = DAOJavaWrapper.testPlanService.getLastByName(testPlanName);
      val testPlanHistory:mutable.Buffer[TestPlanImpl] = DAOJavaWrapper.testPlanService.getProjectHistory(testPlan).asScala;
      Ok(Json.toJson(
        Json.obj("testPlan" -> Json.toJson(TestPlanMirror.from(testPlan)),
          "history" -> Json.toJson(testPlanHistory.map(testPlan => TestPlanMirror.from(testPlan))))))
    }
  }

  @JwtProtected
  def loadTestReport(pName: String, iter:String, tName: String) = Action {
    implicit request => {
      val testPlanName = URLDecoder.decode(pName, "UTF-8")
      val testName = URLDecoder.decode(tName, "UTF-8")
      var p = testPlanService.getByNameAndIteration(testPlanName, iter);
      val campaigns = p.getCampaigns().asScala
      val result = for (campaign <- campaigns;
           testPage <- campaign.getTestCases().asScala;
           if (testPage.getName().equals(testName))
      )yield(Ok(Json.toJson(TestPageMirror.from(testPage))))
      if(result.length > 0){
        result.head
      }else {
        BadRequest("No test found with provided query parameters.")
      }
    }
  }

}
