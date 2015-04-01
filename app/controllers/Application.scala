package controllers

import boot.AppBoot

import com.synpatix.toast.runtime.core.parse._
import com.synaptix.toast.dao.domain.impl.test.TestPage
import com.synaptix.toast.dao.service.dao.access.project._
import com.synaptix.toast.dao.domain.impl.report._
import com.synaptix.toast.dao.report.ProjectHtmlReportGenerator

import controllers.mongo._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.iteratee.Enumerator
import play.api.libs.json.Reads._
import play.api.libs.json.Writes._
import play.api.libs.json._
import play.api.mvc._
import controllers.parsers.WebPageElement


import scala.collection.immutable.StringOps
import scala.util.matching.Regex

case class Prj(id: Option[String], name: String, iterations: Option[Short], campaigns: List[Cpgn])

case class Cpgn(id: Option[String], name: String, scenarii: List[ScenarioWrapper])

case class ScenarioWrapper(name: Option[String], scenario: Option[Scenario])

object Application extends Controller {
  implicit val sFormat = Json.format[ScenarioWrapper]
  implicit val campaignFormat = Json.format[Cpgn]
  implicit val projectFormat = Json.format[Prj]  
  implicit val scenarioRowsFormat = Json.format[ScenarioRows] 

  private val conn = AppBoot.conn
  private val projectJavaDaoService = AppBoot.projectService
  private val repositoryJavaDaoService = AppBoot.repositoryDaoService
  private val jnlpHost = AppBoot.jnlpHost

  def index = Action {  request =>
    request.session.get("connected").map { user =>
      Ok(views.html.index())
    }.getOrElse {
      Ok(views.html.parallax_login_form())
    }
  }

  def loadEnvConfiguration() = Action{
    Ok(jnlpHost)
  }

  def login() = Action(parse.json) { implicit request =>
    //Check credentials and so on...
    Ok(views.html.index()).withSession(
      session + ("connected" -> "user goes here !")
    )
  }

  def logout() = Action {
    Ok("").withNewSession
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
        Json.obj("name" -> "type", "descriptor" -> Json.obj("type" -> Json.arr("button", "input", "menu", "table", "timeline", "date", "list", "checkbox", "other"))),
        Json.obj("name" -> "locator", "descriptor" -> Json.obj()))
      case "service entity" => Json.arr(Json.obj("name" -> "entity", "descriptor" -> Json.obj()),
        Json.obj("name" -> "alias", "descriptor" -> Json.obj()),
        Json.obj("name" -> "search by", "descriptor" -> Json.obj()))
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
   * Save Auto config
   */
  def saveAutoConfigBlock() = Action(parse.json) { implicit request =>
    request.body.validate[AutoSetupConfig].map {
      case config: AutoSetupConfig =>
        conn.saveAutoConfiguration(config)
        conn.refactorScenarii(config)
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
        val pageElements = for (itemLocator <- page.items) yield WebPageElement(None, "", "", itemLocator, Some(""), Some(0))
        conn.saveAutoConfiguration(AutoSetupConfig(None, page.name, "swing page", Some(pageElements)))
        Ok("received inspected page...")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }

  def saveNewInspectedScenario() = Action(parse.json) { implicit request =>
    request.body.validate[InspectedScenario].map {
      case scenario: InspectedScenario =>
        val logInstance = Scenario(id = None, name = scenario.name, cType = "swing", driver = "connecteurSwing", rows = Some(scenario.steps))
        conn.saveScenario(logInstance)
        Ok("scenario saved !")
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
   * load to init repository configuration
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
          for (row <- page.rows.getOrElse(List())) {
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
   * Return the regex value for a type in an automation sentence
   *
   * @param tagType
   */
  def sentenceChunkReplacement(tagType:String) = {
    tagType match {
      case "Value" => """([\\w\\W]+)"""
      case "Variable" => """\\$(\\w+)"""
      case "WebPageItem" => """(\\w+).(\\w+)"""
      case "SwingComponent" => """(\\w+).(\\w+)"""
      case _ => tagType
    }
  }

  def replacePatternByRegex(syntaxes: List[ConfigurationSyntax]): List[ConfigurationSyntax] = {
    lazy val regex = """@\[\[(\d+):[\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+:([\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+)\]\]"""
    def replacePatterns(sentence: String): String = {
      var outputArray = List[String]()
      val replacedSentence = sentence.replaceAll(regex, "@[[$1:_:$2]]")
      val splittedSentence = replacedSentence.split("\\s+")
      splittedSentence.foreach { word => outputArray = sentenceChunkReplacement(word.replaceAll(regex, "$2")) :: outputArray}
      outputArray.reverse.mkString(" ")
    }
    def replaceConfigurationSyntax(syntax: ConfigurationSyntax): ConfigurationSyntax = {
      ConfigurationSyntax(syntax.typed_sentence,replacePatterns(syntax.typed_sentence))
    }
    for (syntax <- syntaxes) yield replaceConfigurationSyntax(syntax)
  }

  /**
   * get all possible pattern sentences for a given scenario type
   */
  def loadCtxSentences(confType: String) = Action.async {
    conn.loadConfigurationSentences(confType).map {
      configurations => {
        var res = List[ConfigurationSyntax]();
        for (configuration <- configurations) {
          for (row <- configuration.rows) {
            if (row.group.equals(confType)) {
              res = res ++ replacePatternByRegex(row.syntax)
            }
          }
        }
        Ok(Json.toJson(res))
      }
    }

  }

  /**
   *
   * @param confType
   * @param context
   * @return
   */
  def loadSentences(confType: String) = Action.async {
    conn.loadConfigurationSentences(confType).map {
      configurations => {
        var res = List[ConfigurationSyntax]();
        for (configuration <- configurations) {
          for (row <- configuration.rows) {
            if (row.group.equals(confType)) {
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
              val pageElements = page.rows.getOrElse(List()).sortWith(_.name < _.name);
              res = res ++ (pageElements.map { element => 
                  JsObject(
                    "label" -> JsString(page.name + "." + element.name) ::
                    "id" -> JsString(element.id.getOrElse(throw new RuntimeException(s"Page $element.name -> $element.id has no Id set !"))) ::
                    Nil
                  );
                }
              )
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
              val pageElements = page.rows.getOrElse(List()).sortWith(_.name < _.name);
              res = res ++ (pageElements.map { element => 
                  JsObject(
                    "label" -> JsString(page.name + "." + element.name) ::
                    "id" -> JsString(element.id.getOrElse(throw new RuntimeException(s"Page $element.name -> $element.id has no Id set !"))) ::
                    Nil
                  );
                }
              )
            }
          }
            Ok(Json.toJson(res));
        }
      }
    }
  }

  /**
   * Load repository
  */
  def loadRepository() = Action {
    Ok(repositoryJavaDaoService.getRepoAsJson())
  }

  def saveRepository() = Action(parse.json) { implicit request =>
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

  def main(args: Array[String]) {
    conn.loadAutoConfiguration.map {
      repository => {
        println(repository)
        println(Json.toJson(repository))
      }
    }
  }
}