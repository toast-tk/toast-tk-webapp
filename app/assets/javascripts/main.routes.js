define(["angular", "exports"], function (angular, exports) {
  'use strict';

  RouterConfig.$inject = ["$stateProvider", "$urlRouterProvider"];

   function RouterConfig($stateProvider, $urlRouterProvider){

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
    }
    /* END : router config function */
    
    exports.RouterConfig = RouterConfig


});