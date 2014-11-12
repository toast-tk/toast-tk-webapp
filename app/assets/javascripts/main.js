(function() {
  "use strict";

  requirejs.config({
    shim: {
      'jsRoutes': {
        deps: [],
        // it's not a RequireJS module, so we have to tell it what var is returned
        exports: 'jsRoutes'
      },
      // Hopefully this all will not be necessary but can be fetched from WebJars in the future
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
      }
    },
    paths: {
      'requirejs': ['../lib/requirejs/require'],
      'jsRoutes': ['/jsroutes'],
      "jquery": "//code.jquery.com/jquery-1.7.2.min",
   	  "angular": "//ajax.googleapis.com/ajax/libs/angularjs/1.0.7/angular.min",
   	  "underscore" : "//underscorejs.org/underscore",
   	  "qTags": ['./libs/jquery-textntags']
    }
  });

  require(["angular", "./services/playRoutes", "./controllers/login", "./controllers/editor", "./directives/components"], function(a, b, login, editor) {
    var app = angular.module("app", ["play.routing", "red.components"]);
    
    app.controller("LoginCtrl", login.LoginCtrl);
    app.controller("EditorCtrl", editor.MainCtrl);
    
    app.config(["$routeProvider", function($routeProvider){
	  $routeProvider.when("/",{ templateUrl: "assets/html/login.html", controller: "LoginCtrl"});
	  $routeProvider.when("/editor",{ templateUrl: "assets/html/editor.html", controller: "EditorCtrl"});
	}]);
	
    angular.bootstrap(document, ["app"]);
});
})();