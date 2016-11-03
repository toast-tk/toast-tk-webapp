package controllers.notifiers
/**
  * Created by akram.tabka on 16/10/2016.
  */

import java.util.concurrent.TimeUnit

import play.api.Logger
import boot.AppBoot
import play.api.libs.json.JsValue
import com.sendgrid._
import play.api.mvc.{Action, Controller}
import com.typesafe.config.ConfigFactory

import java.io.IOException
import scala.concurrent.{Await}
import scala.concurrent.duration.Duration
import scala.util.{Failure, Success}

object MailNotifierController extends Controller {

def sendAskForAccountEmail(newAccount: JsValue) = {
    val login = (newAccount \ "login").as[String]
    val emailaddress = (newAccount \ "email").as[String]
    val teamName = (newAccount \ "teamName").as[String]
    val teamSize = (newAccount \ "teamSize").as[Long] 
    val projectName = (newAccount \ "projectName").as[String]
    val projectDescription = (newAccount \ "projectDescription").as[String]
    
    val from:Email = new Email("bot@toast-tk.io")
    val subject:String = login + " Asking for new account"
    val to:Email = new Email(ConfigFactory.load().getString("toast.mailer.admin"))
    val content:Content = new Content("text/html", s"""<html><body>
      |<h3>New account request:</h3>
      |<h5>Requester Login: $login </h5>
      |<h5>Requester Email: $emailaddress </h5>
      |<h5>Team Name : $teamName </h5>
      |<h5>Team Size : $teamSize </h5>
      |<h5>Project Name : $projectName </h5>
      |<h5>Project Description : $projectDescription </h5>
      |</body></html>""".stripMargin)
    val mail:Mail = new Mail(from, subject, to, content)
    val sg:SendGrid = new SendGrid(ConfigFactory.load().getString("toast.mailer.apiKey"))
    val request:Request = new Request()
    request.method = Method.POST
    request.endpoint = "mail/send"
    request.body = mail.build()
    val response:Response = sg.api(request)
  }

  //TODO: add annotation (hostportected)
  def askForAccount = Action(parse.json) { implicit request =>
    val newAccount = request.body
    try{
      sendAskForAccountEmail(newAccount)
      Ok(s"Email sent!")
    }finally {
      Status(400)("A client error occurred: ")
    }
  }
}