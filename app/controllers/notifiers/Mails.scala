package controllers.notifiers
/**
  * Created by akram.tabka on 16/10/2016.
  */

import java.util.concurrent.TimeUnit

import boot.AppBoot
import play.api.libs.json.JsValue
import play.api.libs.mailer._
import play.api.mvc.{Action, Controller}
import com.typesafe.config.ConfigFactory

import scala.concurrent.{Await}
import scala.concurrent.duration.Duration
import scala.util.{Failure, Success}

object MailNotifierController  extends Controller {
  private val db = AppBoot.db
  val timeout = Duration(5, TimeUnit.SECONDS)

  def getDefaultAppMailer = {
    val mailer = new SMTPMailer(
      SMTPConfiguration(
        ConfigFactory.load().getString("toast.mailer.host"),
        ConfigFactory.load().getInt("toast.mailer.port"),
        ConfigFactory.load().getBoolean("toast.mailer.ssl"),
        ConfigFactory.load().getBoolean("toast.mailer.tls"),
        Some(ConfigFactory.load().getString("toast.mailer.user")),
        Some(ConfigFactory.load().getString("toast.mailer.password"))
      )
    )
    mailer
  }

 def sendAskForAccountEmail(newAccount: JsValue) = {
   val mailer = getDefaultAppMailer
   Await.ready(db.getAllAdminUsers(), timeout).value.get match {
     case Failure(e) => throw e
     case Success(admins) => {
       val adminEmailSeq = admins.map(admin =>{admin.firstName +" <"+ admin.email +">"})
       if(!adminEmailSeq.isEmpty){
         val login = (newAccount \ "login").as[String]
         val emailaddress = (newAccount \ "email").as[String]
         val teamName = (newAccount \ "teamName").as[String]
         val projectName = (newAccount \ "projectName").as[String]
         val email = Email(
           login + " Asking for new account",
           "ToastTk Webapp <" + ConfigFactory.load().getString("toast.mailer.user") + ">",
           adminEmailSeq,
           bodyText = Some("Hi Toast admin,"),
           bodyHtml = Some(
             s"""<html><body>
                 |<h3> $login($emailaddress) is asking for a new account for a team called $teamName in order to work on the project $projectName </h3>
        </body></html>""".stripMargin)
         )
         val id = mailer.send(email)
         id
       } else {
         throw new Exception("no admin found")
       }
     }
   }
  }

  def askForAccount = Action(parse.json) { implicit request =>
    val newAccount = request.body
    println(newAccount.toString())
    try{
      val id = sendAskForAccountEmail(newAccount)
      Ok(s"Email $id sent!")
    }finally {
      Status(200)("A client error occurred: ")
    }

  }
}