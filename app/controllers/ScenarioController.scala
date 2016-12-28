 
package controllers

import boot.{ApiKeyProtected, JwtProtected, AppBoot}
import controllers.Application._
import controllers.mongo.project.Project
import controllers.mongo.scenario.Scenario

import controllers.mongo._
import controllers.mongo.users.User
import play.api.libs.concurrent.Execution.Implicits.defaultContext
import play.api.libs.json.Reads._
import play.api.libs.json.Writes._
import play.api.libs.json._
import play.api.mvc._
import reactivemongo.api.commands.UpdateWriteResult

import scala.concurrent._
import scala.concurrent.duration.Duration
import reactivemongo.bson.{BSONObjectID, BSONDocument}
import scala.util.{Try, Success, Failure}


object ScenarioController extends Controller {

  implicit val scenarioRowsFormat = Json.format[ScenarioRows]
  private val db = AppBoot.db
  private lazy val regex = """\{\{[\w:]+\}\}""".r

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
      res = res + "#scenario id:" + scenario._id.get + "\n"
      res = res + "#scenario driver:" + scenario.driver + "\n"
      res = res + "|| scenario || " + scenario.`type` + " ||\n"
      res = res + lines
      
      JsString(res)
    } catch {
      case e: Exception => {
        //Case where the scenario has been freshly imported from the client
        val lines = scenario.rows.getOrElse("").split("\n").toList.map(row => "|" + row +"|").mkString("\n")
        var res = "h1. Name:" + scenario.name + "\n"
        res = res + "#scenario id:" + scenario._id.get + "\n"
        res = res + "#scenario driver:" + scenario.driver + "\n"
        res = res + "|| scenario || " + scenario.`type` + " ||\n"
        res = res + lines

        JsString(res)
      }
    }
  }

  /**
   * load to wiki scenarii
   * Scenario: (id: Option[String], cType: String, driver: String,rows: String)
   * || scenario || web ||
   * |Type *toto* in *LoginDialog.loginTextField*|
   */
  @ApiKeyProtected
  def loadWikifiedScenarii(apiKey: String) = Action.async {
    val pair: (Option[User], Option[Project]) = db.userProjectPair(apiKey)
    pair match {
      case (Some(user), Some(project)) => {
        db.loadScenarii(project._id.get.stringify).map {
          scenarii => {
            val response = for (scenario <- scenarii) yield wikifiedScenario(scenario)
            Ok(Json.toJson(response))
          }
        }
      }
      case _ => Future{
        BadRequest(s"Detected error: no project available @apiKey(${apiKey})")
      }
    }

  }

  /**
   * Delete scenarii
   */
  @JwtProtected
  def deleteScenarii() = Action(parse.json) { implicit request =>
    request.body.validate[String].map {
      case scenariiId: String =>
       Await.ready(db.deleteScenarii(scenariiId), Duration.Inf).value.get match {
            case Failure(e) => throw e
            case Success(hasNode) => {
              hasNode match {
                case true => {
                  Ok("scenario deleted !")
                }
                case false => {
                  BadRequest("Error: selected has child Node")
                }
              }
          }
        }
    }.recoverTotal {
      e => BadRequest("Detected error:" + JsError.toJson(e))
    }
  }

  /**
   * Save scenarii
   */
  @JwtProtected
  def saveScenarii() = Action(parse.json) { implicit request =>
    request.body.validate[Scenario].map {
      case scenario: Scenario => {
        val persistenceTuple: Option[(Future[UpdateWriteResult], Scenario)] = db.upsertScenario(scenario)
        if(!persistenceTuple.isEmpty){
          val persistedScenario: Scenario = persistenceTuple.get._2
          val result: UpdateWriteResult = Await.result(persistenceTuple.get._1, Duration.Inf)
          if (result.ok) {
            def extendedObject(obj: JsObject) = {
              obj + ("columns" -> DomainController.scenarioDescriptorProvider((obj \ "type").as[String]))
            }
            val flatResponse = extendedObject(Json.toJson(persistedScenario).as[JsObject])
            Ok(Json.toJson(flatResponse))
          } else {
            BadRequest("Node already exists")
          }
        }else {
          BadRequest("Node Cound not be created!")
        }

      }
  }.recoverTotal {
    e => BadRequest("Detected error:" + JsError.toJson(e))
  }
}


  /**
   * load to init scenarii
   */
  @JwtProtected
  def loadScenarii(idProject: String) = Action.async {
    db.loadScenarii(idProject).map {
      scenarii => {
        val input = Json.toJson(scenarii).as[JsArray]
        def extendedObject(obj: JsObject) = {
          obj + ("columns" -> DomainController.scenarioDescriptorProvider((obj \ "type").as[String]))
        }
        val flatResponse = for (i <- input.value) yield extendedObject(i.as[JsObject])
        Ok(Json.toJson(flatResponse))
      }
    }
  }

  /**
   * scenario service type (backend, web, ..)
   */
  @JwtProtected
  def loadScenarioCtx(scenarioType: String) = Action {
    Ok(DomainController.scenarioDescriptorProvider(scenarioType))
  }


  /**
   * load to init scenarii
   */
  @JwtProtected
  def loadScenariiList(idProject: String) = Action.async {
    db.loadScenarii(idProject).map {
      scenarii => {
        val result:List[JsObject] = for (scenario <- scenarii) yield ( Json.obj("id" -> scenario._id.get.stringify, "name" -> scenario.name) )
        val input = Json.toJson(scenarii).as[JsArray]
        val response = for (i <- input.value) yield i.as[JsObject]
        Ok(Json.toJson(result))
      }
    }
  }

  /**
   * load scenario steps
   */
  @JwtProtected
  def loadScenarioSteps(id: String) = Action.async {
    db.loadScenarioById(id).map {
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
            Ok(Json.toJson(Json.obj("type" -> scenario.`type`,"rows" -> lines)))
        }
        case None => BadRequest("Scenario not found !")
      } 
    }
  }

}