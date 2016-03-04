package controllers

import boot.AppBoot
import play.api.Logger
import controllers.mongo._
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.json.Writes._
import play.api.libs.json._
import play.api.mvc._
import controllers.parsers.WebPageElement


object Application extends Controller {
  private val conn = AppBoot.conn
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
    conn.AuthenticateUser()

    Logger.info(s"[+] Loging in !")
    Ok(views.html.index()).withSession(request2session + ("connected" -> "user goes here !"))
  }

  def logout() = Action {
    Ok("").withNewSession
  }
  
  /**
   * auto setup - run config
   *
   */
  def loadAutoSetupCtx(setupType: String) = Action {
    Ok(DomainController.autoSetupCtxProvider(setupType))
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
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  def saveNewInspectedScenario() = Action(parse.json) { implicit request =>
    val scenarioR = Json.fromJson(request.body)(Json.format[InspectedScenario])
    scenarioR.map {
      case scenario: InspectedScenario =>
        val logInstance = Scenario(id = None, 
                                  name = scenario.name, 
                                  cType = "swing", 
                                  driver = "connecteurSwing", 
                                  rows = Some(scenario.steps),
                                  parent = Some("0"))
        conn.savePlainScenario(logInstance)
        Ok("scenario saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }


  /**
   * load to wiki repository configuration
   * case class AutoSetupConfig(id: Option[String], name: String, cType: String, rows: List[WebPageElement])
   * WebPageElement(name: String, elementType: String, locator: String, method: String, position: Int)
   */
  def loadWikifiedRepository() = Action.async {
    conn.loadSwingPageRepository.map {
      repository => {
        def wikifiedObject(page: AutoSetupConfig): JsValue = {
          var res = "page id:" + page.id.get + "\n"
          res = res + "|| setup || " +  page.cType + " || " + page.name + " ||\n"
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
   * get all possible pattern sentences for a given scenario type
   */
  def loadCtxSentences(confType: String) = Action.async {
    conn.loadConfigurationSentences(confType).map {
      configurations => {
        Ok(Json.toJson(configurations))
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
      case "web" => {
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
      case "swing" => {
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

  def persistConfiguration(formerConfiguration: Option[MacroConfiguration], fixtureDescriptor: MojoFixtureDescriptor) = {
      var congifMap = Map[String, List[ConfigurationSyntax]]()
      val fixtureDescriptorList = fixtureDescriptor.sentences
      for (descriptor <- fixtureDescriptorList) {
        val fixtureType: String = descriptor.fixtureType
        val fixtureName: String = descriptor.name
        val fixturePattern: String = descriptor.pattern
        
        val key = fixtureType +":"+fixtureName
        val newConfigurationSyntax: ConfigurationSyntax = ConfigurationSyntax(fixturePattern, fixturePattern)
        val syntaxRows = congifMap.getOrElse(key, List[ConfigurationSyntax]())
        val newSyntaxRows =  newConfigurationSyntax :: syntaxRows
        congifMap = congifMap + (key -> newSyntaxRows)
      }
      
      println(formerConfiguration)
      val configurationRows = for ((k,v) <- congifMap) yield(ConfigurationRow(k.split(":")(0),k.split(":")(1),v) )
    
      formerConfiguration match {
        case None => {
          conn.saveConfiguration(MacroConfiguration(None, fixtureDescriptor.name, configurationRows.toList))
        }
        case Some(conf) => {
          val rows = for {
            macroConfigurationRow <- conf.rows
            if(!macroConfigurationRow.name.equals(configurationRows.head.name)
             && !macroConfigurationRow.group.equals(configurationRows.head.group))
          } yield(macroConfigurationRow)
          val rowsToPersist = configurationRows.head :: rows
          conn.saveConfiguration(MacroConfiguration(conf.id, fixtureDescriptor.name, rowsToPersist.toList))
        }
      }
  }

  /**
   * 
   */
  def onConnectorReceived = Action(parse.json) { implicit request =>
    request.body.validate[MojoFixtureDescriptor].map {
      case fixtureDescriptor: MojoFixtureDescriptor =>
        conn.loadMacroConfiguration(fixtureDescriptor.name).map { 
          configuration => configuration match {
            case None => {
              persistConfiguration(None, fixtureDescriptor)
            }
            case Some(conf) => {
              persistConfiguration(Some(conf), fixtureDescriptor)
            }
          }
        }
        Ok("Auto configuration saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }
}