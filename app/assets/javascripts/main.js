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
        "sidebarmenu": ['controllers/layout/sidebar.menu.controller'],
        "layout": ['controllers/layout/layout.controller'],
        "layoutService" :  ['controllers/layout/layout.service'],
        "SettingsCtrl" :  ['controllers/settings/settings.controller'],
        "newSettingsModalCtrl": ["./controllers/settings/newSettings.modal.controller"],
        "Repository1Ctrl": ["./controllers/repository/repository.controller"],
        "Scenario1Ctrl": ["./controllers/scenario/scenario.controller"],
        "Campaign1Ctrl": ["./controllers/campaign/campaign.controller"],
        "newStepModalCtrl": ["./controllers/scenario/newstep.modal.controller"],
        "newObjectModalCtrl": ["./controllers/repository/newobject.modal.controller"]
    }
  });

  require(["angular", "./services/playRoutes", "./controllers/layout/tree.layout.service" ,
            "loginCtrl", "loginService", "loginResolverService", "./controllers/editor", "./controllers/scenario", "SettingsCtrl", "newSettingsModalCtrl", "Repository1Ctrl", "Scenario1Ctrl", "Campaign1Ctrl",
            "./controllers/configuration","./controllers/repository", "./controllers/home",
            "./controllers/layout/sidebar.menu.controller", "layout", "layoutService", "newObjectModalCtrl", "newStepModalCtrl", "json!config/icon.constants.config.json",

            "./services/client-service",
            "./directives/components", "./libs/sortable", "./libs/ngProgress.min", 
            "./libs/angular-ui-tree.min", "bootstrap", "ui.bootstrap", "angularRoute", "angucomplete",
            "./libs/xeditable", "./libs/angular-ui-router.min", "angular-animate", "sidesplit", "angular-toastr", "webix"], 
          function(a, b, treeLayoutService, login, loginService, loginResolverService, editor, scenario, settingsCtrl, newSettingsModalCtrl, repository1, scenario1, campaign1, configuration, repository, home, sidebarmenu, layout, layoutService, newObjectModalCtrl, newStepModalCtrl, constantsFile) {

              var app = angular.module("app", 
                ['ngRoute', 'ui.router', "play.routing", "ngAnimate",
                "tk.components", "tk.services",
                "ui.sortable", "ngProgress", "ui.tree", "ui.bootstrap", "xeditable", "sidesplit", "webix","angucomplete-alt","toastr"]);
              app.controller("LoginCtrl", login.LoginCtrl);
              app.controller("MainCtrl", home.MainCtrl);
              app.controller("ConfigurationCtrl", configuration.ConfigurationCtrl);
              app.controller("ScenarioCtrl", scenario.ScenarioCtrl);
              app.controller("Scenario1Ctrl", scenario1.Scenario1Ctrl);
              
              app.controller("SettingsCtrl", settingsCtrl.SettingsCtrl);
              app.controller("NewSettingsModalCtrl", newSettingsModalCtrl.NewSettingsModalCtrl);
              

              app.controller("RepositoryCtrl", repository.RepositoryCtrl);
              app.controller("Repository1Ctrl", repository1.RepositoryCtrl);

              app.controller("ProjectCtrl", editor.ProjectCtrl);
              app.controller("Campaign1Ctrl", campaign1.CampaignCtrl);
              
              app.controller("SidebarMenuCtrl", sidebarmenu.SidebarMenuCtrl);
              app.controller("LayoutCtrl", layout.LayoutCtrl);
              
              app.controller("newObjectModalCtrl", newObjectModalCtrl.newObjectModalCtrl);
              app.controller("newStepModalCtrl", newStepModalCtrl.newStepModalCtrl);

              app.service("LoginService", loginService.LoginService);
              app.service("LoginResolverService", loginResolverService.ResolversService);

              app.service("LayoutService", layoutService.LayoutService);
              app.service("TreeLayoutService", treeLayoutService.TreeLayoutService);
              app.constant("ICONS", constantsFile);
              app.config(["$stateProvider", "$urlRouterProvider", "toastrConfig", function($stateProvider, $urlRouterProvider, toastrConfig){

                   angular.extend(toastrConfig, {
                    autoDismiss: false,
                    timeOut: 2000,
                    extendedTimeOut: 300,
                    containerId: 'toast-container',
                    maxOpened: 0,    
                    newestOnTop: true,
                    positionClass: 'toast-top-center',
                    preventDuplicates: false,
                    preventOpenDuplicates: false,
                    target: 'body'
                  });

                  $stateProvider
                  .state('login', {
                      url: "/",
                       views: {
                           'main': {
                      templateUrl: "assets/html/login.html", 
                      controller: "LoginCtrl",
                      resolve:{
                        checkLoggedLogin : ["LoginResolverService", function (LoginResolverService){
                          return LoginResolverService.checkLoggedLoginResolve() ;
                        }]
                      }
                        }
                      }
                  }) 
                  .state('layout', {
                    url: "/",
                    abstract: true,
                    cache: false,
                    views: {
                      'main': {
                        templateUrl: "assets/html/layout/layout.view.html",
                        controller: "LayoutCtrl",
                        resolve:{
                          checkLoggedAndGetUser : ["LoginResolverService", function (LoginResolverService){
                            return LoginResolverService.checkLoggedAndGetUserResolve() ;
                          }]
                        }
                      }
                    }
                  })
                  .state('main', {
                    url: "/main",
                    cache: false,
                    views: {
                     'main': {
                      templateUrl: "assets/html/editor.html", 
                      controller: "MainCtrl"
                    }
                  }
                })
                  .state('layout.settings', {
                    url: "settings",
                    cache: false,
                    views: {
                      'content':{
                       templateUrl: "assets/html/settings/settings.html",
                       controller: "SettingsCtrl"
                     }
                   }
                 })
                  .state('layout.repository1', {
                    url: "repository1",
                    cache: false,
                    views: {
                      'content':{
                       templateUrl: "assets/html/repository/repository.html",
                       controller: "Repository1Ctrl"
                     }
                   }
                 })
                  .state('layout.scenario1', {
                    url: "scenario1",
                    cache: false,
                    views: {
                      'content':{
                       templateUrl: "assets/html/scenario/scenario1.html",
                       controller: "Scenario1Ctrl"
                     }
                   }
                 })
                  .state('layout.campaign1', {
                    url: "campaign1",
                    cache: false,
                    views: {
                      'content':{
                       templateUrl: "assets/html/campaign/campaign.html",
                       controller: "Campaign1Ctrl"
                     }
                   }
                 });
                 $urlRouterProvider.when('','/');
                 $urlRouterProvider.otherwise('/');
              }]);

              app.run(function(editableOptions) {
                editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
                editableOptions.mode = 'popup';
              });

              angular.bootstrap(document, ["app"]);
          });
})();