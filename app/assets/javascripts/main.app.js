var login = require("loginCtrl");
var home = require("homeCtrl");
var scenario = require("scenarioCtrl");
var settingsCtrl = require("SettingsCtrl");
var newSettingsModalCtrl = require("newSettingsModalCtrl");
var repository = require("RepositoryCtrl");
var campaign = require("CampaignCtrl");
var sidebarmenu = require("sidebarmenu");
var layout = require("layout");
var newObjectModalCtrl = require("newObjectModalCtrl");
var utilsScenarioService = require("utilsScenarioService");
var newStepService = require("newStepService");
var newStepModalCtrl = require("newStepModalCtrl");
var loginService = require("loginService");
var loginResolverService = require("loginResolverService");
var layoutService = require("layoutService");
var treeLayoutService = require("treeLayoutService");
var constantsFile = require("json!javascripts/config/icon.constants.config.json");
var adminLayoutCtrl = require("adminLayoutCtrl");
var adminSidebarmenu = require("adminSidebarmenu");
var addUserCtrl = require("addUserCtrl");
var routerConfig = require("routerConfig");
var configConfig = require("configConfig");

var app = angular.module("app", 
  ['ui.router', "play.routing", "ngAnimate",
  "tk.components", "tk.services",
  "ui.sortable", "ngProgress", "ui.tree", "ui.bootstrap",
      "xeditable", "sidesplit", "webix","angucomplete-alt","toastr"]);

app.controller("LoginCtrl", login.LoginCtrl);
app.controller("MainCtrl", home.MainCtrl);

app.controller("ScenarioCtrl", scenario.ScenarioCtrl);

app.controller("SettingsCtrl", settingsCtrl.SettingsCtrl);
app.controller("NewSettingsModalCtrl", newSettingsModalCtrl.NewSettingsModalCtrl);

app.controller("RepositoryCtrl", repository.RepositoryCtrl);

app.controller("CampaignCtrl", campaign.CampaignCtrl);

app.controller("SidebarMenuCtrl", sidebarmenu.SidebarMenuCtrl);
app.controller("LayoutCtrl", layout.LayoutCtrl);

app.controller("newObjectModalCtrl", newObjectModalCtrl.newObjectModalCtrl);
app.service("UtilsScenarioService", utilsScenarioService.UtilsScenarioService); 
app.service("NewStepService", newStepService.NewStepService); 

app.controller("newStepModalCtrl", newStepModalCtrl.newStepModalCtrl);

app.service("LoginService", loginService.LoginService);
app.service("LoginResolverService", loginResolverService.ResolversService);

app.service("LayoutService", layoutService.LayoutService);
app.service("TreeLayoutService", treeLayoutService.TreeLayoutService);
app.constant("ICONS", constantsFile);

/* admin */
app.controller("AdminLayoutCtrl", adminLayoutCtrl.AdminLayoutCtrl);
app.controller("AdminSidebarMenuCtrl", adminSidebarmenu.AdminSidebarMenuCtrl);
app.controller("AddUserCtrl", addUserCtrl.AddUserCtrl);

app.config(routerConfig.RouterConfig);
app.config(configConfig.ConfigConfig);

app.run(function(editableOptions) {
                editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
                editableOptions.mode = 'popup';
              });

angular.bootstrap(document, ["app"]);
