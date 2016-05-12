  require(["angular", "playRoutes",  "routerConfig", "configConfig", "treeLayoutService" ,
            "loginCtrl", "loginService", "loginResolverService", "SettingsCtrl", "newSettingsModalCtrl", "RepositoryCtrl", "ScenarioCtrl", "CampaignCtrl", "utilsScenarioService", 
            "homeCtrl",
            "sidebarmenu", "layout", "layoutService", "newObjectModalCtrl", "newStepService", "newStepModalCtrl", "json!javascripts/config/icon.constants.config.json",
            "adminLayoutCtrl", "adminSidebarmenu", "addUserCtrl", "EditUserCtrl",


            "clientService",
            "componentsDir", "sortable", "ngProgress", 
            "angular-ui-tree", "bootstrap", "ui.bootstrap", "angularRoute", "angucomplete",
            "xeditable", "ui.router", "angular-animate", "sidesplit", "angular-toastr", "webix"], 
          function(a, b, routerConfig, configConfig, treeLayoutService, login, loginService, loginResolverService, settingsCtrl, newSettingsModalCtrl, repository, scenario, campaign, utilsScenarioService, home, sidebarmenu, layout, layoutService, newObjectModalCtrl, newStepService, newStepModalCtrl, constantsFile,
           adminLayoutCtrl, adminSidebarmenu, addUserCtrl, editUserCtrl) {

              var app = angular.module("app", 
                ['ui.router', "play.routing", "ngAnimate",
                "tk.components", "tk.services",
                "ui.sortable", "ngProgress", "ui.tree", "ui.bootstrap", "xeditable", "sidesplit", "webix","angucomplete-alt","toastr"]);
              
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
              app.controller("EditUserCtrl", editUserCtrl.EditUserCtrl);

              app.config(routerConfig.RouterConfig);
              app.config(configConfig.ConfigConfig);

              app.run(function(editableOptions) {
                editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
                editableOptions.mode = 'popup';
              });

              angular.bootstrap(document, ["app"]);
          });