import io.toast.tk.runtime.bean.ActionItem
import org.junit.runner._
import org.scalatest.junit.JUnitRunner
import play.api.mvc.Controller
import controllers.InnerDomainController
import org.scalatestplus.play._

@RunWith(classOf[JUnitRunner])
class ApplicationSpec extends PlaySpec {

  class TestDomainController extends Controller with InnerDomainController

  "DomainController" should {

    "1: initalize action items descriptor" in {
      val controller = new TestDomainController()
      val result = controller.actionItems.size > 0
      result mustBe true
    } 
    
    "2e: find variable action item description" in {
      val controller = new TestDomainController()
      val result = controller.findActionItemByCategoryAndType(ActionItem.ActionCategoryEnum.value, ActionItem.ActionTypeEnum.string)
      println(result.regex)
      result.regex mustBe "\\*([^\\*]*)\\*"
    } 

  }
}

