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
          controllers.routes.javascript.RepositoryController.saveServiceConfigBlock,
          controllers.routes.javascript.RepositoryController.saveAutoConfigBlock,
          controllers.routes.javascript.RepositoryController.loadAutoConfiguration,
          controllers.routes.javascript.RepositoryController.loadServiceEntityRepository,
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
          controllers.routes.javascript.ProjectController.saveProject,
          controllers.routes.javascript.ProjectController.loadProject,
          controllers.routes.javascript.ProjectController.loadProjectReport,
          controllers.routes.javascript.Application.loadEnvConfiguration,
          controllers.routes.javascript.Application.logout,
          controllers.routes.javascript.Users.logout,
          controllers.routes.javascript.Users.user)
    ).as(JAVASCRIPT)
  }
}