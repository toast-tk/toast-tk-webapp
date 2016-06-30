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
                  .state('layout.repository', {
                    url: "repository",
                    cache: false,
                    views: {
                      'content':{
                       templateUrl: "assets/html/repository/repository.html",
                       controller: "RepositoryCtrl"
                     }
                   }
                 })
                  .state('layout.scenario', {
                    url: "scenario",
                    cache: false,
                    views: {
                      'content':{
                       templateUrl: "assets/html/scenario/scenario.html",
                       controller: "ScenarioCtrl"
                     }
                   }
                 })
                  .state('layout.campaign', {
                    url: "campaign",
                    cache: false,
                    views: {
                      'content':{
                       templateUrl: "assets/html/campaign/campaign.html",
                       controller: "CampaignCtrl"
                     }
                   }
                 })
                  .state('adminLayout', {
                    url: "/panel",
                    cache: false,
                    views: {
                      'main': {
                        templateUrl: "assets/html/admin/layout/layout.view.html",
                        controller: "AdminLayoutCtrl",
                        resolve:{
                          checkLoggedAndGetUser : ["LoginResolverService", function (LoginResolverService){
                            return LoginResolverService.checkLoggedAndGetUserResolve() ;
                          }]
                        }
                      }
                    }
                  })
                  .state('adminLayout.addUser', {
                    url: "/user",
                    cache: false,
                    views: {
                      'content': {
                        templateUrl: "assets/html/admin/accounts/adduser.html",
                        controller: "AddUserCtrl"
                      }
                    }
                  })
                  .state('adminLayout.editUser', {
                    url: "/user/edit/:idUser",
                    cache: false,
                    views: {
                      'content': {
                        templateUrl: "assets/html/admin/accounts/edituser.html",
                        controller: "EditUserCtrl"
                      }
                    }
                  })
                  .state('adminLayout.editUsers', {
                    url: "/users",
                    cache: false,
                    views: {
                      'content': {
                        templateUrl: "assets/html/admin/accounts/editusers.html",
                        controller: "EditUsersCtrl"
                      }
                    }
                  })
                  .state('adminLayout.addTeam', {
                    url: "/team",
                    cache: false,
                    views: {
                      'content': {
                        templateUrl: "assets/html/admin/accounts/addteam.html",
                        controller: "AddTeamCtrl"
                      }
                    }
                  })
                  .state('adminLayout.editTeam', {
                    url: "/team/edit",
                    cache: false,
                    views: {
                      'content': {
                        templateUrl: "assets/html/admin/accounts/editteam.html",
                        controller: "EditTeamCtrl"
                      }
                    }
                  });
                 $urlRouterProvider.when('','/');
                 $urlRouterProvider.otherwise('/');
    }
    /* END : router config function */
    
    exports.RouterConfig = RouterConfig


});