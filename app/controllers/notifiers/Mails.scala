package controllers.notifiers
/**
  * Created by akram.tabka on 16/10/2016.
  */

import play.api.libs.json.JsValue
import play.api.libs.mailer._
import play.api.mvc.{Action, Controller}
import com.typesafe.config.ConfigFactory

object MailNotifierController  extends Controller {

 def buildAskForAccountEmail(newAccount: JsValue) = {
   val login = (newAccount \ "login").as[String]
   val emailaddress = (newAccount \ "email").as[String]
   val teamName = (newAccount \ "teamName").as[String]
   val projectName = (newAccount \ "projectName").as[String]
    val email = Email(
      login + " Asking for new account",
      "ToastTk Webapp <" + ConfigFactory.load().getString("toast.mailer.user") + ">",
      Seq(ConfigFactory.load().getString("toast.admin.firstName")+" <"+ ConfigFactory.load().getString("toast.admin.email") +">"),
      bodyText = Some("Hi Toast admin,"),
      bodyHtml = Some(
        s"""<html><body>
           |<h3> $login($emailaddress) is asking for a new account for a team called $teamName in order to work on the project $projectName </h3>
        </body></html>""".stripMargin)
    )

   email
  }

  def askForAccount = Action(parse.json) { implicit request =>
    val newAccount = request.body
    println(newAccount.toString())

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

    val id = mailer.send(buildAskForAccountEmail(newAccount))
    Ok(s"Email $id sent!")
  }
}