 
package controllers

import play.api.libs.json.Writes._
import play.api.libs.json._
import play.api.mvc._


object DomainController extends Controller with InnerDomainController

trait InnerDomainController {
  this: Controller =>


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
      case "service entity" => Json.arr(Json.obj("name" -> "name", "descriptor" -> Json.obj()),
        Json.obj("name" -> "alias", "descriptor" -> Json.obj()),
        Json.obj("name" -> "searchBy", "descriptor" -> Json.obj(), "label" -> "search by"))
      case _ => Json.arr();
    }
  }

  def scenarioDescriptorProvider(scenarioType: String): JsArray = {
    scenarioType match {
      case "web" => Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false),
        Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
      case "swing" => Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false),
        Json.obj("name" -> "expected result", "reference" -> false, "post" -> true),
        Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
      case "service" => Json.arr(Json.obj("name" -> "patterns", "reference" -> true, "post" -> false),
        Json.obj("name" -> "comment", "reference" -> false, "post" -> true))
      case _ => Json.arr();
    }
  }

  /**
   * Return the regex value for a type in an automation sentence
   *
   * @param tagType
   */
  def sentenceChunkReplacement(tagType:String) = {
    tagType match {
      case "Value" => """\\*([\\w\\W]+)\\*"""
      case "Variable" => """(\\$\\w+)"""
      case "WebPageItem" => """(\\w+).(\\w+)"""
      case "SwingComponent" => """(\\w+).(\\w+)"""
      case _ => tagType
    }
  }


  /**
   */
  def getTypedPatternRegexReplacement(serviceType: String, word:String): String = {
    serviceType match {
      case "swing" => word match {
        case "([\\w\\W]+)" |"""(\w+)""" | "\\*([\\w\\W]+)\\*" | """\\*(\\w+)\\*""" | """\*([\w\W]+)\*""" | """([\w\W]+)""" | """([\\w\\W]+)""" => "@[[1:string:Value]]"
        case "\\$(\\w+)" | "(\\$\\w+)" | """(\$[\w]+)"""| """(\\$\\w+)""" | """(\$\w+)""" => "@[[2:variable ($name):Variable]]"
        case "(\\w+).(\\w+)" | "\\*(\\w+).(\\w+)\\*" | """\*(\w+).(\w+)\*""" | """\\*(\\w+).(\\w+)\\*""" => "@[[6:reference:SwingComponent]]"
        case _ => word
      }
      case "web" => word match {
        case "([\\w\\W]+)" |"""(\w+)""" | "\\*([\\w\\W]+)\\*" | """\\*(\\w+)\\*""" | """\*([\w\W]+)\*""" | """([\w\W]+)""" | """([\\w\\W]+)""" => "@[[1:string:Value]]"
        case "\\$(\\w+)" | "(\\$\\w+)" | """(\$[\w]+)""" | """(\\$\\w+)""" | """(\$\w+)""" => "@[[2:variable ($name):Variable]]"
        case "(\\w+).(\\w+)" | "\\*(\\w+).(\\w+)\\*" | """\*(\w+).(\w+)\*""" | """\\*(\\w+).(\\w+)\\*""" => "@[[4:reference:WebPageItem]]"
        case _ => word
      }
      case "service" => word match {        
        case "([\\w\\W]+)" | """(\w+)""" | "\\*([\\w\\W]+)\\*" | """\\*(\\w+)\\*""" | """\*([\w\W]+)\*""" | """([\w\W]+)""" | """([\\w\\W]+)""" => "@[[1:string:Value]]"
        case "\\$(\\w+)" | "(\\$\\w+)" | """(\$[\w]+)"""| """(\\$\\w+)""" | """(\$\w+)""" => "@[[2:variable ($name):Variable]]"
        case _ => word
      }
      case _ => word
    }
  }

  /*
   *
   */
  def getPlainPatternRegexReplacement(serviceType: String, word:String): String = {
    serviceType match {
      case "swing" => word match {
        case "([\\w\\W]+)" | """(\w+)""" | "\\*([\\w\\W]+)\\*" | """\\*(\\w+)\\*""" | """\*([\w\W]+)\*""" | """([\w\W]+)""" | """([\\w\\W]+)""" => "Value"
        case "\\$(\\w+)" | "(\\$\\w+)" | """(\$[\w]+)""" | """(\\$\\w+)""" | """(\$\w+)""" => "Variable"
        case "(\\w+).(\\w+)" | "\\*(\\w+).(\\w+)\\*"| """\*(\w+).(\w+)\*"""  | """\\*(\\w+).(\\w+)\\*"""=> "SwingComponent"
        case _ => word
      }
      case "web" => word match {
        case "([\\w\\W]+)" | """(\w+)""" | "\\*([\\w\\W]+)\\*" | """\\*(\\w+)\\*""" | """\*([\w\W]+)\*""" | """([\w\W]+)""" | """([\\w\\W]+)""" => "Value"
        case "\\$(\\w+)" | "(\\$\\w+)" | """(\$[\w]+)""" | """(\\$\\w+)""" | """(\$\w+)""" => "Variable"
        case "(\\w+).(\\w+)" | "\\*(\\w+).(\\w+)\\*" | """\*(\w+).(\w+)\*""" | """\\*(\\w+).(\\w+)\\*""" => "WebPageItem"
        case _ => word
      }
      case "service" => word match {
        case "([\\w\\W]+)" | """(\w+)""" | "\\*([\\w\\W]+)\\*" | """\\*(\\w+)\\*""" | """\*([\w\W]+)\*""" | """([\w\W]+)""" | """([\\w\\W]+)""" => "Value"
        case "\\$(\\w+)" | "(\\$\\w+)" | """(\$[\w]+)""" | """(\\$\\w+)""" | """(\$\w+)""" => "Variable"
        case _ => word
      }
      case _ => word
    }
  }
}

