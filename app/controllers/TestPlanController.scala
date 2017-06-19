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



case class TestLineMirror(test:Option[String],
                          expected:Option[String],
                          testResultKind:Option[String],
                          testResult: Option[String],
                          contextualSentence: Option[String],
                          comment: Option[String],
                          screenshot: Option[String] = None,
                          executionTime: Option[Long])

case class TestPageBlockMirror(fixtureName: String,
                               technicalErrorNumber: Int,
                               testSuccessNumber: Int,
                               testFailureNumber: Int,
                               blockLines: List[TestLineMirror])

case class TestPageMirror(id: Option[String],
                          name: Option[String],
                          idScenario: Option[String],
                          executionTime: Option[Long],
                          technicalErrorNumber: Option[Int],
                          testFailureNumber: Option[Int],
                          testSuccessNumber: Option[Int],
                          isPreviousIsSuccess: Option[Boolean],
                          previousExecutionTime: Option[Long],
                          isSuccess: Option[Boolean],
                          isFatal: Option[Boolean],
                          blocks: Option[List[TestPageBlockMirror]])

case class CampaignMirror(id: Option[String],
                          name: String,
                          scenarii: Option[List[TestPageMirror]])

case class TestPlanMirror(id: Option[String],
                          name: String,
                          iterations: Option[Short],
                          campaigns: List[CampaignMirror],
                          creationDate: Option[String],
                          project: Option[Project] = None)

object TestLineMirror{
  def from(line: TestLine): TestLineMirror = {
    val testResultKind = if(line.getTestResult() == null) "None" else getResultKindAsString(line.getTestResult().getResultKind())
    val testResult = if(line.getTestResult() == null) "None" else line.getTestResult().getMessage()
    val sentence = if(line.getTestResult() == null) line.getTest() else line.getTestResult().getContextualTestSentence()
    val maybeScreenshot = if(line.getTestResult == null) None else if (line.getTestResult().getScreenShot() == null) None else Some(line.getTestResult().getScreenShot())
    new TestLineMirror(Some(line.getTest()),
                        Some(line.getExpected()),
                        Some(testResultKind),
                        Some(testResult),
                        Some(sentence),
                        Some(line.getComment()),
                        maybeScreenshot,
                        Some(line.getExecutionTime()))
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
      Some(testPage.getExecutionTime()),
      Some(testPage.getTechnicalErrorNumber()),
      Some(testPage.getTestFailureNumber()),
      Some(testPage.getTestSuccessNumber()),
      Some(testPage.isPreviousIsSuccess()),
      Some(testPage.getPreviousExecutionTime()),
      Some(testPage.isSuccess()),
      Some(testPage.isFatal()),
      Some(flattenedBlocks)
    )
  }
}

object CampaignMirror {
  def from(campaign: ICampaign):CampaignMirror = {
    var scenarios = List[TestPageMirror]()
    for (testPage <- campaign.getTestCases.asScala) {
      scenarios = TestPageMirror.from(testPage) :: scenarios
    }
    new CampaignMirror(Some(campaign.getIdAsString()), campaign.getName(), Some(scenarios.reverse))
  }
}

object TestPlanMirror{
  def from(testPlanImpl: TestPlanImpl):TestPlanMirror = {
    var campaignsMirrors = List[CampaignMirror]()
    val campaigns = testPlanImpl.getCampaigns().asScala
    for (campaign <- campaigns) {
      campaignsMirrors = CampaignMirror.from(campaign) :: campaignsMirrors
    }
    val format = new SimpleDateFormat("dd/MM/yyyy hh:mm")
    new TestPlanMirror(Some(testPlanImpl.getId().toString()),
      testPlanImpl.getName(),
      Some(testPlanImpl.getIteration()),
      campaignsMirrors.reverse,
      Some(format.format(testPlanImpl.getCreationDate()))
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
        val scenarios = cpgn.scenarii.getOrElse(List())
        val testPages:List[Option[ITestPage]] = for (wrapper <- scenarios) yield {
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
      testPlan.setId(tp.id.get)
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
            val key = testPlanService.saveTemplate(tranformTestPlan(testPlan))
            val savedTestPlan = DAOJavaWrapper.testPlanService.findTestPlanById(key.getId().toString())
            Ok(Json.toJson(TestPlanMirror.from(savedTestPlan)))
          }
          case Some(id) => {
            val updatedTestPlan = testPlanService.updateTemplateFromTestPlan(tranformTestPlan(testPlan))
            val savedTestPlan = testPlanService.updateTemplateFromTestPlan(tranformTestPlan(testPlan))
            Ok(Json.toJson(TestPlanMirror.from(updatedTestPlan.asInstanceOf[TestPlanImpl])))
          }
        }
      }
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  @JwtProtected
  def detachTestPlanReport(idTestPlan: String) = Action {
    implicit request => {
      val testPlan = DAOJavaWrapper.testPlanService.findTestPlanById(idTestPlan);
      testPlan match {
        case t:TestPlanImpl => {
          DAOJavaWrapper.testPlanService.detachTemplate(t)
          Ok
        }
        case _ => BadRequest("No test plan found for provided id: " + idTestPlan)
      }
    }
  }

  @JwtProtected
  def loadProjectReport(idProject:String, name: String) = Action {
    implicit request => {
      val testPlanName = URLDecoder.decode(name, "UTF-8")
      val testPlan:TestPlanImpl = DAOJavaWrapper.testPlanService.getLastByName(testPlanName, idProject);
      val testPlanHistory:mutable.Buffer[TestPlanImpl] = DAOJavaWrapper.testPlanService.getProjectHistory(testPlan).asScala;
      Ok(Json.toJson(
        Json.obj("testPlan" -> Json.toJson(TestPlanMirror.from(testPlan)),
          "history" -> Json.toJson(testPlanHistory.map(testPlan => TestPlanMirror.from(testPlan))))))
    }
  }

  @JwtProtected
  def loadTestReport(pName: String, iter:String, tName: String, idProject:String) = Action {
    implicit request => {
      val testPlanName = URLDecoder.decode(pName, "UTF-8")
      val testName = URLDecoder.decode(tName, "UTF-8")
      var p = testPlanService.getByNameAndIteration(testPlanName, idProject, iter);
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
