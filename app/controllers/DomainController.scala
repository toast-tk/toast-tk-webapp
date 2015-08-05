 
package controllers

import play.api.Play
import play.api.Play.current
import play.api.libs.json.Writes._
import play.api.libs.json._
import play.api.mvc._
import com.synaptix.toast.runtime.core.runtime._
import scala.collection.JavaConversions._
import org.apache.commons.io.IOUtils
import java.nio.charset.Charset
import java.io.File

object DomainController extends Controller with InnerDomainController

trait InnerDomainController {
  this: Controller =>

  val actionItems = ActionItemDescriptionCollector.initActionItems().toList
  type ActionCategory = ActionItem.ActionCategoryEnum
  type ActionType = ActionItem.ActionTypeEnum
  
  def typeDescriptor () = Action{
    val jsonDescriptor = Play.application.resourceAsStream("type_descriptor.json")
    val jsonString = IOUtils.toString(jsonDescriptor.get, "UTF-8")
    Ok(Json.parse(jsonString))
  }

  def findActionItemByCategoryAndType(actionCategory: ActionCategory, actionType: ActionType) = {
    val actionItem: ActionItem = actionItems.filter(actionItem => actionItem.kind == actionType && actionItem.category == actionCategory).head
    actionItem
  }

    def findActionItemByCategoryAndType(actionCategory: String, actionType: String) = {
    val actionItem: ActionItem = actionItems.filter(actionItem => actionItem.kind.name() == actionType && actionItem.category.name() == actionCategory).head
    actionItem
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

}

