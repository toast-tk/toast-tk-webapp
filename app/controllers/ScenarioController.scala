 
package controllers

import boot.AppBoot

import com.synaptix.toast.runtime.core.parse._
import com.synaptix.toast.dao.domain.impl.test.TestPage
import com.synaptix.toast.dao.service.dao.access.project._
import com.synaptix.toast.dao.domain.impl.report._

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


object ScenarioController extends Controller {

  implicit val scenarioRowsFormat = Json.format[ScenarioRows]
  private val conn = AppBoot.conn
  private lazy val regex = """@\[\[\d+:[\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+:[\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+\]\]""".r

  private def populatePatterns(rows: String): List[String] = {
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

    //val kind = (Json.parse(rows) \ "kind").asOpt[String].getOrElse()
    val modifiedPatterns = for (i <- 0 until patterns.length) yield
      replacePatterns(patterns(i).as[String], if (mappings.isDefinedAt(i)) mappings(i).as[List[JsValue]] else List())
    modifiedPatterns.toList
  }

  /**
   *
   */
  def wikifiedScenario(scenario: Scenario): JsValue = {
    try { 
      val scenarioRows: List[ScenarioRows] = Json.parse(scenario.rows.getOrElse("[]")).as[List[ScenarioRows]]
      val scenarioKinds: List[String] = scenarioRows.map{row => row.kind.getOrElse("")}
      val lines = if (scenarioRows.length > 0){
        populatePatterns(scenario.rows.getOrElse(""))
        .zip (scenarioKinds)
        .map { zippedScenari => {
            val sentence = zippedScenari._1
            zippedScenari._2 match {
              case "" => "| " + sentence + " |\n"
              case kind:String => "| @" + kind + " " + sentence + " |\n"
            }
          }
        }
        .mkString("") + "\n"
      } else {
        scenario.rows.getOrElse("").split("\n").toList.map(row => "|" + row +"|").mkString("\n")
      }

      var res = "h1. Name:" + scenario.name + "\n"
      res = res + "#scenario id:" + scenario.id.get + "\n"
      res = res + "#scenario driver:" + scenario.driver + "\n"
      res = res + "|| scenario || " + scenario.cType + " ||\n"
      res = res + lines
      
      JsString(res)
    } catch {
      case e: Exception => {
        //Case where the scenario has been freshly imported from the client
        val lines = scenario.rows.getOrElse("").split("\n").toList.map(row => "|" + row +"|").mkString("\n")
        var res = "h1. Name:" + scenario.name + "\n"
        res = res + "#scenario id:" + scenario.id.get + "\n"
        res = res + "#scenario driver:" + scenario.driver + "\n"
        res = res + "|| scenario || " + scenario.cType + " ||\n"
        res = res + lines

        JsString(res)
      }
    }
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
   * Delete scenarii
   */
  def deleteScenarii() = Action(parse.json) { implicit request =>
    request.body.validate[String].map {
      case scenariiId: String =>
        conn.deleteScenarii(scenariiId)
        Ok("scenario deleted !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
    }
  }

  /**
   * Save scenarii
   */
  def saveScenarii() = Action(parse.json) { implicit request =>
    request.body.validate[Scenario].map {
      case scenario: Scenario =>
        conn.saveScenario(scenario)
        Ok("scenario saved !")
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toFlatJson(e))
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
          obj + ("columns" -> DomainController.scenarioDescriptorProvider((obj \ "type").as[String]))
        }
        val response = for (i <- input.value) yield extendedObject(i.as[JsObject])
        Ok(Json.toJson(response))
      }
    }
  }

  /**
   * scenario service type (backend, web, ..)
   */
  def loadScenarioCtx(scenarioType: String) = Action {
    Ok(DomainController.scenarioDescriptorProvider(scenarioType))
  }


  /**
   * load to init scenarii
   */
  def loadScenariiList() = Action.async {
    conn.loadScenarii.map {
      scenarii => {
        val result:List[JsObject] = for (scenario <- scenarii) yield ( Json.obj("id" -> scenario.id.get, "name" -> scenario.name) )
        val input = Json.toJson(scenarii).as[JsArray]
        val response = for (i <- input.value) yield i.as[JsObject]
        Ok(Json.toJson(result))
      }
    }
  }

  /**
   * load scenario steps
   */
  def loadScenarioSteps(id: String) = Action.async {
    conn.loadScenarioById(id).map {
      result => result match {
        case Some(scenario) => {
            val scenarioRows: List[ScenarioRows] = Json.parse(scenario.rows.getOrElse("[]")).as[List[ScenarioRows]]
            val scenarioKinds: List[String] = scenarioRows.map{row => row.kind.getOrElse("")}
            val lines = if (scenarioRows.length > 0){
              populatePatterns(scenario.rows.getOrElse(""))
              .zip (scenarioKinds)
              .map { zippedScenari => {
                  val sentence = zippedScenari._1
                  zippedScenari._2 match {
                    case "" =>  sentence + "\n"
                    case kind:String => "@" + kind + " " + sentence + "\n"
                  }
                }
              }
              .mkString("") + "\n"
            } else {
              scenario.rows.getOrElse("").split("\n").toList.mkString("\n")
            }
            Ok(Json.toJson(Json.obj("type" -> scenario.cType,"rows" -> lines)))
        }
        case None => BadRequest("Scenario not found !")
      } 
    }
  }

}