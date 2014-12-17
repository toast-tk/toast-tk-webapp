package controllers

import com.synpatix.redpepper.backend.core.parse._
import com.mongo.test.domain.impl.test.TestPage
import com.mongo.test.service.dao.access.project._
import com.mongo.test.domain.impl.report._
import com.mongo.test.ProjectHtmlReportGenerator

import controllers.mongo._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.iteratee.Enumerator
import play.api.libs.json.Reads._
import play.api.libs.json.Writes._
import play.api.libs.json._
import play.api.mvc._
import controllers.parsers.WebPageElement

import boot.Global

import scala.collection.immutable.StringOps

case class Prj(id: Option[String], name: String, iterations: Option[Short], campaigns: List[Cpgn])

case class Cpgn(id: Option[String], name: String, scenarii: List[ScenarioWrapper])

case class ScenarioWrapper(name: Option[String], scenario: Option[Scenario])

object Application extends Controller {
  implicit val sFormat = Json.format[ScenarioWrapper]
  implicit val campaignFormat = Json.format[Cpgn]
  implicit val projectFormat = Json.format[Prj]
  val conn = Global.conn


  val projectJavaDaoService = Global.projectService

  def index = Action {
    Ok(views.html.parallax_login_form())
  }

  def login() = Action(parse.json) { implicit request =>
    //Check credentials and so on...
    //Ok(Json.obj("token" -> java.util.UUID.randomUUID().toString))
    Ok(views.html.index())
  }

  /**
   * auto setup - run config
   *
   */
  def loadAutoSetupCtx(setupType: String) = Action {
    Ok(autoSetupCtxProvider(setupType))
  }

  def autoSetupCtxProvider(setupType: String): JsArray = {
    setupType match {
      case "web page" => Json.arr(Json.obj("name" -> "name", "descriptor" -> Json.obj()),
        Json.obj("name" -> "type", "descriptor" -> Json.obj("type" -> Json.arr("button", "link"))),
        Json.obj("name" -> "locator", "descriptor" -> Json.obj()),
        Json.obj("name" -> "method", "descriptor" -> Json.obj("type" -> Json.arr("CSS", "XPATH", "ID"))),
        Json.obj("name" -> "position", "descriptor" -> Json.obj()))
      case "swing page" => Json.arr(Json.obj("name" -> "name", "descriptor" -> Json.obj()),
        Json.obj("name" -> "type", "descriptor" -> Json.obj("type" -> Json.arr("button", "input", "menu", "table", "timeline", "date", "list", "other"))),
        Json.obj("name" -> "locator", "descriptor" -> Json.obj()))
      case "configure entity" => Json.arr(Json.obj("name" -> "entity", "descriptor" -> Json.obj()),
        Json.obj("name" -> "alias", "descriptor" -> Json.obj()),
        Json.obj("name" -> "search by", "descriptor" -> Json.obj()))
      case _ => Json.arr();
    }
  }

  /**
   * scenario service type (backend, web, ..)
   *
   */
  def loadScenarioCtx(scenarioType: String) = Action {
    Ok(scenarioDescriptorProvider(scenarioType))
  }

  def scenarioDescriptorProvider(scenarioType: String): JsArray = {
    scenarioType match {
      case "web" => Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false),
        Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
      case "swing" => Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false),
        Json.obj("name" -> "expected result", "reference" -> false, "post" -> true),
        Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
      case "backend" => Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false),
        Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
      case _ => Json.arr();
    }
  }

  /**
   * Save Meta config
   */
  def saveConfiguration() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[MacroConfiguration]].map {
      case configs: Seq[MacroConfiguration] =>
        for {
          conf <- configs
        } yield conn.saveConfiguration(conf)
        Ok("configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }

  /**
   * Save Auto config
   */
  def saveAutoConfig() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[AutoSetupConfig]].map {
      case configs: Seq[AutoSetupConfig] =>
        for {
          conf <- configs
        } yield conn.saveAutoConfiguration(conf)
        Ok("auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }

  /**
   * Save new page
   */
  def saveNewInspectedPage() = Action(parse.json) { implicit request =>
    request.body.validate[InspectedPage].map {
      case page: InspectedPage =>
        val pageElements = for (itemLocator <- page.items) yield WebPageElement("", "", itemLocator, Some(""), Some(0))
        conn.saveAutoConfiguration(AutoSetupConfig(None, page.name, "swing page", pageElements))
        Ok("received inspected page...")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
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
        val testPages = (for (c <- campaigns; wrapper <- c.scenarii) yield parseTestPage(wrapper.scenario.get, wikifiedScenario(wrapper.scenario.get).as[String]))
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

  /**
   * load to init projects
   */
  def loadProject() = Action {
    val projects = projectJavaDaoService.find().asList().iterator
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

  /**
   * Save scenarii
   */
  def saveScenarii() = Action(parse.json) { implicit request =>
    request.body.validate[Seq[Scenario]].map {
      case scenarii: Seq[Scenario] =>
        for {
          scenario <- scenarii
        } yield conn.saveScenario(scenario)
        Ok("scenario saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }

  /**
   * load to init configuration
   */
  def loadConfiguration() = Action.async {
    conn.loadConfiguration.map {
      configurations => {
        Ok(Json.toJson(configurations))
      }
    }
  }

  /**
   * load to init scenarii
   */
  def loadScenarii() = Action.async {
    conn.loadScenarii.map {
      scenarii => {
        val input = Json.toJson(scenarii).as[JsArray]
        def extendedObject(obj: JsObject) = {
          obj + ("columns" -> scenarioDescriptorProvider((obj \ "type").as[String]))
        }
        val response = for (i <- input.value) yield extendedObject(i.as[JsObject])
        Ok(Json.toJson(response))
      }
    }
  }

  def wikifiedScenario(scenario: Scenario): JsValue = {
    lazy val regex = """@\[\[\d+:[\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+:[\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+\]\]""".r
    def populatePatterns(rows: String): List[String] = {
      def replacePatterns(pattern: String, mapping: List[JsValue]): String = {
        var outputArray = List[String]()
        var mappingPosition = 0
        val splittedPattern = pattern.split("\\s+")
        splittedPattern.foreach { word =>
          word match {
            case regex() =>
              var replacementWord = "";
              for (jsonMapping <- mapping) {
                val pos = (jsonMapping \ "pos").as[Int]
                if (pos.equals(mappingPosition)) replacementWord = (jsonMapping \ "val").as[String]
              }
              outputArray = ("*" + replacementWord + "*") :: outputArray
              mappingPosition = mappingPosition + 1
            case x => outputArray = x :: outputArray
          }
        }
        outputArray.reverse.mkString(" ")
      }

      val patterns = Json.parse(rows) \\ "patterns"
      val mappings = Json.parse(rows) \\ "mappings"
      val modifiedPatterns = for (i <- 0 until patterns.length) yield
        replacePatterns(patterns(i).as[String], if (mappings.isDefinedAt(i)) mappings(i).as[List[JsValue]] else List())
      modifiedPatterns.toList
    }
    var res = "h1. Name:" + scenario.name + "\n"
    res = res + "#scenario id:" + scenario.id.get + "\n"
    res = res + "#scenario driver:" + scenario.driver + "\n"
    res = res + "|| scenario || " + scenario.cType + " ||\n"
    res = res + populatePatterns(scenario.rows).map { sentence => "| " + sentence + " |\n"}.mkString("") + "\n"
    JsString(res)
  }


  /**
   * load to wiki scenarii
   * Scenario: (id: Option[String], cType: String, driver: String,rows: String)
   * || scenario || swing ||
   * |Type *toto* in *LoginDialog.loginTextField*|
   */
  def loadWikifiedScenarii() = Action.async {
    conn.loadScenarii.map {
      scenarii => {
        val response = for (scenario <- scenarii) yield wikifiedScenario(scenario)
        Ok(Json.toJson(response))
      }
    }
  }

  /**
   * load to init configuration
   */
  def loadAutoConfiguration() = Action.async {
    conn.loadAutoConfiguration.map {
      repository => {
        val input = Json.toJson(repository).as[JsArray]
        def extendedObject(obj: JsObject) = {
          obj + ("columns" -> autoSetupCtxProvider((obj \ "type").as[String]))
        }
        val response = for (i <- input.value) yield extendedObject(i.as[JsObject])
        Ok(Json.toJson(response))
      }
    }
  }

  /**
   * load to wiki repository configuration
   * case class AutoSetupConfig(id: Option[String], name: String, cType: String, rows: List[WebPageElement])
   * WebPageElement(name: String, elementType: String, locator: String, method: String, position: Int)
   */
  def loadWikifiedRepository() = Action.async {
    conn.loadAutoConfiguration.map {
      repository => {
        def wikifiedObject(page: AutoSetupConfig): JsValue = {
          var res = "page id:" + page.id.get + "\n"
          res = res + "|| auto setup || " + page.name + " ||\n"
          res = res + "| " + page.cType + " | " + page.name + " |\n"
          res = res + "| name | type | locator |\n"
          for (row <- page.rows) {
            res = res + "|" + row.name + "|" + row.elementType + "|" + row.locator + "|\n"
          }
          res = res + "\n"
          JsString(res)
        }
        val response = for (page <- repository) yield wikifiedObject(page)
        Ok(Json.toJson(response))
      }
    }
  }

  /**
   * load services json descriptors
   */
  def loadServiceDescriptors(serviceType: String, driverName: String) = Action.async {
    conn.loadConfStaticSentences(serviceType, driverName).map {
      sentences => {
        val out = for (s <- sentences) yield (Json.parse(s) \\ "patterns")
        val outSentences = out.flatMap { x => x}
        Ok(Json.toJson(outSentences))
      }
    }
  }

  /**
   * get all possible pattern sentences for a given scenario type
   */
  def loadCtxSentences(confType: String, context: String) = Action.async {
    conn.loadConfigurationSentences(confType, context).map {
      configurations => {
        /*val res = configurations.filterNot(conf => {
          conf.rows.filterNot(row => row.group.equals(confType) && row.name.equals(context)).length > 0
        })*/
        var res = List[ConfigurationSyntax]();
        for (configuration <- configurations) {
          for (row <- configuration.rows) {
            if (row.group.equals(confType) && row.name.equals(context)) {
              res = res ++ row.syntax
            }
          }
        }
        Ok(Json.toJson(res))
      }
    }

  }

  /**
   * Get the data to be proposed in a select list for a given context
   * a context = { itemName [WebPageItem, Entity..], other values to refine the result set}
   *
   */
  def loadCtxTagData(itemName: String) = Action.async {
    itemName match {
      case "WebPageItem" => {
        var res = List[JsValue]();
        conn.loadWebPagesFromRepository().map {
          pageConfigurations => {
            for (page <- pageConfigurations) {
              val pageElements = page.rows;
              res = res ++ (pageElements.map { element => JsString(page.name + "." + element.name)});
            }
          }
            Ok(Json.toJson(res));
        }
      }
      case "SwingComponent" => {
        var res = List[JsValue]();
        conn.loadSwingPagesFromRepository().map {
          pageConfigurations => {
            for (page <- pageConfigurations) {
              val pageElements = page.rows;
              res = res ++ (pageElements.map { element => JsString(page.name + "." + element.name)});
            }
          }
            Ok(Json.toJson(res));
        }
      }
    }
  }

  def main(args: Array[String]) {
    conn.loadAutoConfiguration.map {
      repository => {
        println(repository)
        println(Json.toJson(repository))
      }
    }
  }

}