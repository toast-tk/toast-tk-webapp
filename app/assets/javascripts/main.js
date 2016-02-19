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
      'sidesplit':{
        deps: ['angular']
      },
      'webix':{
        deps: ['angular']
      },
       'sidebarmenu':{
        deps: ['angular']
      }
    },
    paths: {
        'requirejs': ['../lib/requirejs/require'],
        'jsRoutes': ['/jsroutes'],
        "jquery": "//code.jquery.com/jquery-1.7.2.min",
        "jquery-ui" : "//code.jquery.com/ui/1.9.2/jquery-ui.min",
        "angular": "//ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular",
        "angularRoute": "//ajax.googleapis.com/ajax/libs/angularjs/1.3.14/angular-route",
	      "ui-sortable" : ['./libs/sortable'],
        "underscore" : "//underscorejs.org/underscore",
        "qTags": ['./libs/jquery-textntags'],
        "angular-ui-tree": ['/libs/angular-ui-tree.min'],
        "ui.bootstrap": ['/libs/ui-bootstrap-tpls-0.12.1'],
        "xeditable": ['libs/xeditable'],
        "ui.router": ['libs/angular-ui-router.min'],
        "webix": ['libs/webix'],
        "sidesplit": ['libs/angular-sidesplit.provider'],
        "sidebarmenu": ['controllers/layout/sidebar.menu.controller'],
        "layout": ['controllers/layout/layout.controller'],
        "Scenario1Ctrl": ["./controllers/scenario1"]
    }
  });

  require(["angular", "./services/playRoutes", "./services/scenario.service" ,
            "./controllers/login", "./controllers/editor", "./controllers/scenario", "Scenario1Ctrl",
            "./controllers/configuration","./controllers/repository", "./controllers/home",
            "./controllers/layout/sidebar.menu.controller", "layout",
            "./services/client-service",
            "./directives/components", "./libs/sortable", "./libs/ngProgress.min", 
            "./libs/angular-ui-tree.min", "./libs/ui-bootstrap-tpls-0.12.1", "angularRoute",
            "./libs/xeditable", "./libs/angular-ui-router.min", "sidesplit", "webix"], 
          function(a, b, ScenarioService, login, editor, scenario, scenario1, configuration, repository, home, sidebarmenu, layout) {

              var app = angular.module("app", 
                ['ngRoute', 'ui.router', "play.routing", 
                "tk.components", "tk.services",
                "ui.sortable", "ngProgress", "ui.tree", "ui.bootstrap", "xeditable", "sidesplit", "webix"]);
              app.controller("LoginCtrl", login.LoginCtrl);
              app.controller("MainCtrl", home.MainCtrl);
              app.controller("ConfigurationCtrl", configuration.ConfigurationCtrl);
              app.controller("ScenarioCtrl", scenario.ScenarioCtrl);
              app.controller("Scenario1Ctrl", scenario1.Scenario1Ctrl);
              
              app.controller("RepositoryCtrl", repository.RepositoryCtrl);
              app.controller("ProjectCtrl", editor.ProjectCtrl);
              app.controller("SidebarMenuCtrl", sidebarmenu.SidebarMenuCtrl);
              app.controller("LayoutCtrl", layout.LayoutCtrl);
              
              app.service("ScenarioService", ScenarioService.ScenarioService);

              app.config(["$stateProvider", function($stateProvider){
                  /*$routeProvider.when("/",{ templateUrl: "assets/html/login.html", controller: "LoginCtrl"});
                  $routeProvider.when("/main",{ templateUrl: "assets/html/editor.html", controller: "MainCtrl"});
                  $routeProvider.when("/configuration",{ templateUrl: "assets/html/configuration.html", controller: "ConfigurationCtrl"});
                  $routeProvider.when("/scenario",{ templateUrl: "assets/html/scenario.html", controller: "ScenarioCtrl"});
                  $routeProvider.when("/repository",{ templateUrl: "assets/html/repository.html", controller: "RepositoryCtrl"});
                  $routeProvider.when("/project",{ templateUrl: "assets/html/project.html", controller: "ProjectCtrl"});*/
                  $stateProvider
                  .state('login', {
                      url: "/",
                       views: {
                           'main': {
                      templateUrl: "assets/html/login.html", 
                      controller: "LoginCtrl"
                        }
                      }
                  })
                  .state('main', {
                      url: "/main",
                      views: {
                         'main': {
                      templateUrl: "assets/html/editor.html", 
                      controller: "MainCtrl"
                       }
                     }
                  })
                  .state('configuration', {
                      url: "/configuration",
                      views: {
                         'main': {
                      templateUrl: "assets/html/configuration.html",
                      controller: "ConfigurationCtrl"
                          }
                      }
                  })
                  .state('scenario', {
                      url: "/scenario",
                      views: {
                         'main': {
                      templateUrl: "assets/html/scenario.html",
                       controller: "ScenarioCtrl"
                        }
                      }
                  })
                  .state('repository', {
                      url: "/repository",
                      views: {
                         'main': {
                      templateUrl: "assets/html/repository.html",
                      controller: "RepositoryCtrl"
                        }
                     }
                  })
                  .state('project', {
                      url: "/project",
                      views: {
                         'main': {
                      templateUrl: "assets/html/project.html",
                      controller: "ProjectCtrl"
                    }
                  }
                  })

                  
        .state('layout', {
          url: "/",
          abstract: true,
          views: {
            'main': {
              templateUrl: "assets/html/layout/layout.view.html",
              controller: "LayoutCtrl",
            }
          }
        })
        .state('layout.scenario1', {
      url: "scenario1",
      views: {
        'content':{
         templateUrl: "assets/html/scenario1.html",
         controller: "Scenario1Ctrl"
       }
     }
   });

/*                  $routeProvider.when("/scenario1",{ templateUrl: "assets/html/scenario1.html", controller: "ScenarioCtrl"});
*/
/*                  $routeProvider.otherwise("/main");*/
              }]);

              app.run(function(editableOptions) {
                editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
                editableOptions.mode = 'popup';
              });

              angular.bootstrap(document, ["app"]);
          });
})();