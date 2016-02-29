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
        "sidesplit": ['libs/angular-sidesplit.provider'],
        "angucomplete": ['libs/angucomplete-alt.min'],
        "sidebarmenu": ['controllers/layout/sidebar.menu.controller'],
        "layout": ['controllers/layout/layout.controller'],
        "Repository1Ctrl": ["./controllers/repository/repository.controller"],
        "Scenario1Ctrl": ["./controllers/scenario/scenario.controller"],
        "newStepModalCtrl": ["./controllers/scenario/newstep.modal.controller"],
        "newObjectModalCtrl": ["./controllers/repository/newobject.modal.controller"]
    }
  });

  require(["angular", "./services/playRoutes", "./services/scenario.service" ,
            "./controllers/login", "./controllers/editor", "./controllers/scenario", "Repository1Ctrl", "Scenario1Ctrl",
            "./controllers/configuration","./controllers/repository", "./controllers/home",
            "./controllers/layout/sidebar.menu.controller", "layout", "newObjectModalCtrl", "newStepModalCtrl", "json!config/icon.constants.config.json",

            "./services/client-service",
            "./directives/components", "./libs/sortable", "./libs/ngProgress.min", 
            "./libs/angular-ui-tree.min", "bootstrap", "ui.bootstrap", "angularRoute", "angucomplete",
            "./libs/xeditable", "./libs/angular-ui-router.min", "angular-animate", "sidesplit", "webix"], 
          function(a, b, ScenarioService, login, editor, scenario, repository1, scenario1, configuration, repository, home, sidebarmenu, layout, newObjectModalCtrl, newStepModalCtrl, constantsFile) {

              var app = angular.module("app", 
                ['ngRoute', 'ui.router', "play.routing", "ngAnimate",
                "tk.components", "tk.services",
                "ui.sortable", "ngProgress", "ui.tree", "ui.bootstrap", "xeditable", "sidesplit", "webix","angucomplete-alt"]);
              app.controller("LoginCtrl", login.LoginCtrl);
              app.controller("MainCtrl", home.MainCtrl);
              app.controller("ConfigurationCtrl", configuration.ConfigurationCtrl);
              app.controller("ScenarioCtrl", scenario.ScenarioCtrl);
              app.controller("Scenario1Ctrl", scenario1.Scenario1Ctrl);
              
              app.controller("RepositoryCtrl", repository.RepositoryCtrl);
              app.controller("Repository1Ctrl", repository1.RepositoryCtrl);

              app.controller("ProjectCtrl", editor.ProjectCtrl);
              app.controller("SidebarMenuCtrl", sidebarmenu.SidebarMenuCtrl);
              app.controller("LayoutCtrl", layout.LayoutCtrl);
              
              app.controller("newObjectModalCtrl", newObjectModalCtrl.newObjectModalCtrl);
              app.controller("newStepModalCtrl", newStepModalCtrl.newStepModalCtrl);

              app.service("ScenarioService", ScenarioService.ScenarioService);
              app.constant("ICONS", constantsFile);
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
        .state('layout.repository1', {
              url: "repository1",
              views: {
                'content':{
                 templateUrl: "assets/html/repository/repository.html",
                 controller: "Repository1Ctrl"
               }
             }
      })
      .state('layout.scenario1', {
          url: "scenario1",
          views: {
            'content':{
             templateUrl: "assets/html/scenario/scenario1.html",
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