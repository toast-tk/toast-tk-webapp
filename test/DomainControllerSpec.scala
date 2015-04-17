import org.specs2.mutable._
import org.specs2.runner._
import org.junit.runner._
import play.api.test._
import play.api.test.Helpers._
import play.api.mvc.Controller
import controllers.InnerDomainController

@RunWith(classOf[JUnitRunner])
class ApplicationSpec extends PlaySpecification {

  class TestDomainController extends Controller with InnerDomainController

  "DomainController" should {
    "replace \\*(\\w+).(\\w+)\\ by @[[6:reference:SwingComponent]]" in {
      val controller = new TestDomainController()
      val replacement = controller.getTypedPatternRegexReplacement("swing", "\\*(\\w+).(\\w+)\\*")
      replacement must be equalTo "@[[6:reference:SwingComponent]]"
    }
    
    "replace ([\\w\\W]+) by @[[1:string:Value]]" in {
      val controller = new TestDomainController()
      val replacement = controller.getTypedPatternRegexReplacement("swing", "([\\w\\W]+)")
      replacement must be equalTo "@[[1:string:Value]]"
    }
    
    "convert regex in sentence to know label" in {
      val controller = new TestDomainController()
      val fixturePattern: String = "Cliquer sur ([\\w\\W]+)"
      val result = fixturePattern.split(" ").map ( word => {
          controller.getPlainPatternRegexReplacement("swing", word)
        }).mkString(" ")
      result must be equalTo "Cliquer sur Value"  
    }

    "1: convert regex in sentence to know types" in {
      val controller = new TestDomainController()
      val fixturePattern: String = "Cliquer sur ([\\w\\W]+)"
      val result = fixturePattern.split(" ").map ( word => {
          controller.getTypedPatternRegexReplacement("swing", word)
        }).mkString(" ")
      result must be equalTo "Cliquer sur @[[1:string:Value]]"  
    }

    "2: convert regex in sentence to know types" in {
      val controller = new TestDomainController()
      val fixturePattern: String = "\\*([\\w\\W]+)\\* AS ([\\w\\W]+)"
      val result = fixturePattern.split(" ").map ( word => {
          controller.getTypedPatternRegexReplacement("swing", word)
        }).mkString(" ")
      result must be equalTo "@[[1:string:Value]] AS @[[1:string:Value]]"  
    }
    
    "3: convert regex in sentence to know types" in {
      val controller = new TestDomainController()
      val fixturePattern: String = """Saisir \*([\w\W]+)\* dans \*([\w\W]+)\* pour le flux (\\$\\w+) au \*([\w\W]+)\*"""
      val result = fixturePattern.split(" ").map ( word => {
          controller.getTypedPatternRegexReplacement("swing", word)
        }).mkString(" ")
      result must be equalTo "Saisir @[[1:string:Value]] dans @[[1:string:Value]] pour le flux @[[2:variable ($name):Variable]] au @[[1:string:Value]]"  
    }    

    "4: convert regex in sentence to know types" in {
      val controller = new TestDomainController()
      val fixturePattern: String = """swi-normal/assemblage.prevision/findOnePrevisionForTnr \*([\w\W]+)\* AS ([\w\W]+)"""
      val result = fixturePattern.split(" ").map ( word => {
          controller.getTypedPatternRegexReplacement("swing", word)
        }).mkString(" ")
      result must be equalTo """swi-normal/assemblage.prevision/findOnePrevisionForTnr @[[1:string:Value]] AS @[[1:string:Value]]"""  
    } 

    "4: convert regex in sentence to know types" in {
      val controller = new TestDomainController()
      val fixturePattern: String = """Multiplier (\$[\w]+) par \*([\w\W]+)\*"""
      val result = fixturePattern.split(" ").map ( word => {
          controller.getTypedPatternRegexReplacement("swing", word)
        }).mkString(" ")
      result must be equalTo """Multiplier @[[2:variable ($name):Variable]] par @[[1:string:Value]]"""  
    } 


    
  }
}
