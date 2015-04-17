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
      'angularRoute': ['angular']
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
      "ui.bootstrap": ['/libs/ui-bootstrap-tpls-0.12.1']
    }
  });

  require(["angular", "./services/playRoutes", 
          "./controllers/login", "./controllers/editor", "./controllers/scenario", 
          "./controllers/configuration","./controllers/repository", "./controllers/home",
          "./directives/components", "./libs/sortable", "./libs/ngProgress.min", 
          "./libs/angular-ui-tree.min", "./libs/ui-bootstrap-tpls-0.12.1", "angularRoute"], 
          function(a, b, login, editor, scenario, configuration, repository, home) {
    var app = angular.module("app", ['ngRoute', "play.routing", "red.components", "ui.sortable", "ngProgress", "ui.tree", "ui.bootstrap"]);
    
    app.controller("LoginCtrl", login.LoginCtrl);
    app.controller("MainCtrl", home.MainCtrl);
    app.controller("ConfigurationCtrl", configuration.ConfigurationCtrl);
    app.controller("ScenarioCtrl", scenario.ScenarioCtrl);
    app.controller("RepositoryCtrl", repository.RepositoryCtrl);
    app.controller("ProjectCtrl", editor.ProjectCtrl);
    
    app.config(["$routeProvider", function($routeProvider){
	    $routeProvider.when("/",{ templateUrl: "assets/html/login.html", controller: "LoginCtrl"});
	    $routeProvider.when("/main",{ templateUrl: "assets/html/editor.html", controller: "MainCtrl"});
      $routeProvider.when("/configuration",{ templateUrl: "assets/html/configuration.html", controller: "ConfigurationCtrl"});
      $routeProvider.when("/scenario",{ templateUrl: "assets/html/scenario.html", controller: "ScenarioCtrl"});
      $routeProvider.when("/repository",{ templateUrl: "assets/html/repository.html", controller: "RepositoryCtrl"});
      $routeProvider.when("/project",{ templateUrl: "assets/html/project.html", controller: "ProjectCtrl"});
      $routeProvider.otherwise("/main");
	  }]);
	
    angular.bootstrap(document, ["app"]);
});
})();