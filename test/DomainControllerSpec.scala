import org.specs2.mutable._
import org.specs2.runner._
import org.junit.runner._
import play.api.test._
import play.api.test.Helpers._
import com.synaptix.toast.runtime.core.runtime._
import play.api.mvc.Controller
import controllers.InnerDomainController

@RunWith(classOf[JUnitRunner])
class ApplicationSpec extends PlaySpecification {

  class TestDomainController extends Controller with InnerDomainController

  "DomainController" should {

    "6: initalize action items descriptor" in {
      val controller = new TestDomainController()
      val result = controller.actionItems.size > 0
      result must be equalTo true  
    } 
    
    "7: find variable action item description" in {
      val controller = new TestDomainController()
      val result = controller.findActionItemByCategoryAndType(ActionItem.ActionCategoryEnum.value, ActionItem.ActionTypeEnum.string)
      result.regex must be equalTo "\\*([\\w\\W]+)\\*"  
    } 

  }
}
