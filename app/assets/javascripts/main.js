(function() {
  "use strict";

  requirejs.config({
    shim: {
      'jsRoutes': {
        deps: ['angular'],
        exports: 'jsRoutes'
      },
      'angular': {
        deps: ['jquery', 'qTags'],
        exports: 'angular'
      },
      'qTags': {
        deps: ['jquery', 'underscore'],
        exports: 'qTags'
      },
      'jquery': {
      	deps: [],
      	exports: '$'
      },
      'underscore': {
      	deps: [],
      	exports: '_'
      },
      'angular-ui-tree':{
        deps: ['angular']
      },
      'jquery-ui':{
        deps: ['jquery']
      },
      'angularRoute': ['angular'],
      'ui.router':{
        deps: ['angular']
      },
      'angular-toastr':  ['angular'],
      'sidesplit':{
        deps: ['angular']
      },
      'angular-animate':{
        deps: ['angular']
      },
      'bootstrap': {
        deps: ['jquery']
      },
      'ui.bootstrap': {
        deps: ['angular','bootstrap']
      },
      'webix':{
        deps: ['angular']
      },
      'angucomplete':{
        deps: ['angular']
      },
      'sidebarmenu':{
        deps: ['angular']
      }
    },
    paths: {
        'requirejs': ['../lib/requirejs/require'],
        text : './libs/require-plugins/text',
        json : './libs/require-plugins/json',
        'jsRoutes': ['/jsroutes'],
        "jquery": "//code.jquery.com/jquery-2.2.0.min",
        "jquery-ui" : "//code.jquery.com/ui/1.9.2/jquery-ui.min",
        "angular": "//ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular",
        "angularRoute": "//ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular-route",
	      "ui-sortable" : ['./libs/sortable'],
        "underscore" : "//underscorejs.org/underscore",
        "qTags": ['./libs/jquery-textntags'],
        "angular-ui-tree": ['/libs/angular-ui-tree.min'],
        "angular-animate":['libs/angular-animate.min'],
        "bootstrap":['libs/bootstrap.min'],
        "ui.bootstrap": ['libs/ui-bootstrap-tpls-0.12.1'],
        "xeditable": ['libs/xeditable'],
        "ui.router": ['libs/angular-ui-router.min'],
        "webix": ['libs/webix'],
        "angular-toastr": ['libs/angular-toastr.tpls.min'],
        "sidesplit": ['libs/angular-sidesplit.provider'],
        "angucomplete": ['libs/angucomplete-alt.min'],
        "loginCtrl" : ['auth/login'],
        "loginService" : ['auth/login.service'],
        "loginResolverService" : ['auth/login.resolver.service'],
        "sidebarmenu": ['features/layout/sidebar.menu.controller'],
        "layout": ['features/layout/layout.controller'],
        "layoutService" :  ['features/layout/layout.service'],
        "SettingsCtrl" :  ['features/settings/settings.controller'],
        "newSettingsModalCtrl": ["./features/settings/newSettings.modal.controller"],
        "RepositoryCtrl": ["./features/repository/repository.controller"],
        "ScenarioCtrl": ["./features/scenario/scenario.controller"],
        "CampaignCtrl": ["./features/campaign/campaign.controller"],
        "utilsScenarioService" : ["./features/scenario/utils.scenario.service"],
        "newStepService": ["./features/scenario/newstep.service"],
        "newStepModalCtrl": ["./features/scenario/newstep.modal.controller"],
        "newObjectModalCtrl": ["./features/repository/newobject.modal.controller"],
        "routerConfig": ["./main.routes"],
        "configConfig": ["./main.config"]
    }
  });

  require(["angular", "./services/playRoutes",  "routerConfig", "configConfig", "./features/layout/tree.layout.service" ,
            "loginCtrl", "loginService", "loginResolverService", "SettingsCtrl", "newSettingsModalCtrl", "RepositoryCtrl", "ScenarioCtrl", "CampaignCtrl", "utilsScenarioService", 
            "./features/home",
            "./features/layout/sidebar.menu.controller", "layout", "layoutService", "newObjectModalCtrl", "newStepService", "newStepModalCtrl", "json!config/icon.constants.config.json",

            "./services/client-service",
            "./directives/components", "./libs/sortable", "./libs/ngProgress.min", 
            "./libs/angular-ui-tree.min", "bootstrap", "ui.bootstrap", "angularRoute", "angucomplete",
            "./libs/xeditable", "./libs/angular-ui-router.min", "angular-animate", "sidesplit", "angular-toastr", "webix"], 
          function(a, b, routerConfig, configConfig, treeLayoutService, login, loginService, loginResolverService, settingsCtrl, newSettingsModalCtrl, repository, scenario, campaign, utilsScenarioService, home, sidebarmenu, layout, layoutService, newObjectModalCtrl, newStepService, newStepModalCtrl, constantsFile) {

              var app = angular.module("app", 
                ['ngRoute', 'ui.router', "play.routing", "ngAnimate",
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

              app.config(routerConfig.RouterConfig);
              app.config(configConfig.ConfigConfig);

              app.run(function(editableOptions) {
                editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
                editableOptions.mode = 'popup';
              });

              angular.bootstrap(document, ["app"]);
          });
})();