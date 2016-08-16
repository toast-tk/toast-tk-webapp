package controllers


import play.api.Routes
import play.api.mvc.{Action, Controller}

object JavaScript extends Controller {

  def jsRoutes(varName: String = "jsRoutes") = Action { implicit request =>
    Ok(
      Routes.javascriptRouter(varName)(
          controllers.routes.javascript.Application.login,
          controllers.routes.javascript.DomainController.typeDescriptor,
          controllers.routes.javascript.ConfigurationController.saveConfiguration,
          controllers.routes.javascript.ConfigurationController.loadConfiguration,
          controllers.routes.javascript.RepositoryController.saveAutoConfig,
          controllers.routes.javascript.RepositoryController.saveAutoConfigBlock,
          controllers.routes.javascript.RepositoryController.loadAutoConfiguration,
          controllers.routes.javascript.RepositoryController.loadWebPageRepository,
          controllers.routes.javascript.RepositoryController.deleteObject,
          controllers.routes.javascript.Application.loadCtxTagData,
          controllers.routes.javascript.Application.loadAutoSetupCtx,
          controllers.routes.javascript.Application.loadCtxSentences,
          controllers.routes.javascript.Application.loadSentences,
          controllers.routes.javascript.ScenarioController.loadScenarii,
          controllers.routes.javascript.ScenarioController.loadScenarioCtx,
          controllers.routes.javascript.ScenarioController.saveScenarii,
          controllers.routes.javascript.ScenarioController.deleteScenarii,
          controllers.routes.javascript.TestPlanController.saveProject,
          controllers.routes.javascript.TestPlanController.loadProject,
          controllers.routes.javascript.TestPlanController.loadProjectReport,
          controllers.routes.javascript.Application.loadEnvConfiguration,
          controllers.routes.javascript.Application.logout,
          controllers.routes.javascript.UserController.logout,
          controllers.routes.javascript.UserController.user,
          controllers.routes.javascript.UserController.saveUser,
          controllers.routes.javascript.UserController.getAllUsers,
          controllers.routes.javascript.UserController.deleteUser,
          controllers.routes.javascript.TeamController.saveTeam,
          controllers.routes.javascript.TeamController.getAllTeams )
    ).as(JAVASCRIPT)
  }
}