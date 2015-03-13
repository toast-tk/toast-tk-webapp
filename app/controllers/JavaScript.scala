package controllers


import play.api.Routes
import play.api.mvc.{Action, Controller}

object JavaScript extends Controller {

  def jsRoutes(varName: String = "jsRoutes") = Action { implicit request =>
    Ok(
      Routes.javascriptRouter(varName)(
          controllers.routes.javascript.Application.login,
          controllers.routes.javascript.Application.loadScenarioCtx,
          controllers.routes.javascript.Application.saveConfiguration,
          controllers.routes.javascript.Application.saveAutoConfig,
          controllers.routes.javascript.Application.loadConfiguration,
          controllers.routes.javascript.Application.loadAutoConfiguration,
          controllers.routes.javascript.Application.loadCtxTagData,
          controllers.routes.javascript.Application.loadAutoSetupCtx,
          controllers.routes.javascript.Application.loadCtxSentences,
          controllers.routes.javascript.Application.loadSentences,
          controllers.routes.javascript.Application.loadScenarii,
          controllers.routes.javascript.Application.saveScenarii,
          controllers.routes.javascript.Application.saveProject,
          controllers.routes.javascript.Application.loadProject,
          controllers.routes.javascript.Application.loadProjectReport,
          controllers.routes.javascript.Application.loadEnvConfiguration,
          controllers.routes.javascript.Application.logout,
          controllers.routes.javascript.Users.user)
    ).as(JAVASCRIPT)
  }
}