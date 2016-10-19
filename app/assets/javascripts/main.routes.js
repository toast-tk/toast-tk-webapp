define(["angular", "exports"], function (angular, exports) {
    'use strict';

    RouterConfig.$inject = ["$stateProvider", "$urlRouterProvider"];

    function RouterConfig($stateProvider, $urlRouterProvider){

        $stateProvider.state('askForAccount', {
            url: "/account/ask",
            views: {
                'main': {
                    templateUrl: "assets/html/askForAccount.html",
                    controller: "AskForAccountCtrl"
                }
            }
        })
        .state('login', {
            url: "/",
            views: {
                'main': {
                    templateUrl: "assets/html/login.html",
                    controller: "LoginCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('layout', {
            url: "/",
            abstract: true,
            cache: false,
            views: {
                'main': {
                    templateUrl: "assets/html/layout/layout.view.html",
                    controller: "LayoutCtrl",
                    resolve:{
                        user : ["LoginResolverService", function (resolver){
                            return resolver.checkLoggedAndGetUserResolve() ;
                        }],
                        defaultProject : ["LoginResolverService", "user", function (resolver, user){
                            return resolver.checkDefaultProjectResolve(user) ;
                        }]
                    }
                }
            }
        }).state('main', {
            url: "main",
            cache: false,
            views: {
                'main': {
                    templateUrl: "assets/html/editor.html",
                    controller: "MainCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('project', {
            url: "/project",
            cache: false,
            views: {
                'main':{
                    templateUrl: "assets/html/projects.html",
                    controller: "MainProjectCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('layout.settings', {
            url: "settings",
            cache: false,
            views: {
                'content':{
                    templateUrl: "assets/html/settings/settings.html",
                    controller: "SettingsCtrl",
                    resolve:{
                        user : ["LoginResolverService", function (resolver){
                            return resolver.checkLoggedAndGetUserResolve() ;
                        }],
                        defaultProject : ["LoginResolverService", "user", function (resolver, user){
                            return resolver.checkDefaultProjectResolve(user) ;
                        }]
                    }
                }
            }
        }).state('layout.repository', {
            url: "repository",
            cache: false,
            views: {
                'content':{
                    templateUrl: "assets/html/repository/repository.html",
                    controller: "RepositoryCtrl",
                    resolve:{
                        user : ["LoginResolverService", function (resolver){
                            return resolver.checkLoggedAndGetUserResolve() ;
                        }],
                        defaultProject : ["LoginResolverService", "user", function (resolver, user){
                            return resolver.checkDefaultProjectResolve(user) ;
                        }]
                    }
                }
            }
        }).state('layout.scenario', {
            url: "scenario",
            cache: false,
            views: {
                'content':{
                    templateUrl: "assets/html/scenario/scenario.html",
                    controller: "ScenarioCtrl",
                    resolve:{
                        user : ["LoginResolverService", function (resolver){
                            return resolver.checkLoggedAndGetUserResolve() ;
                        }],
                        defaultProject : ["LoginResolverService", "user", function (resolver, user){
                            return resolver.checkDefaultProjectResolve(user) ;
                        }]
                    }
                }
            }
        }).state('layout.campaign', {
            url: "campaign",
            cache: false,
            views: {
                'content':{
                    templateUrl: "assets/html/campaign/campaign.html",
                    controller: "CampaignCtrl",
                    resolve:{
                        user : ["LoginResolverService", function (resolver){
                            return resolver.checkLoggedAndGetUserResolve() ;
                        }],
                        defaultProject : ["LoginResolverService", "user", function (resolver, user){
                            return resolver.checkDefaultProjectResolve(user) ;
                        }]
                    }
                }
            }
        }).state('adminLayout', {
            url: "/admin",
            cache: false,
            views: {
                'main': {
                    templateUrl: "assets/html/admin/layout/layout.view.html",
                    controller: "AdminLayoutCtrl",
                    resolve:{
                        user : ["LoginResolverService", function (resolver){
                            return resolver.checkLoggedAndGetUserResolve() ;
                        }],
                        defaultProject : ["LoginResolverService", "user", function (resolver, user){
                            return resolver.checkDefaultProjectResolve(user) ;
                        }]
                    }
                }
            }
        }).state('adminLayout.addUser', {
            url: "/user",
            cache: false,
            views: {
                'content': {
                    templateUrl: "assets/html/admin/accounts/adduser.html",
                    controller: "AddUserCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('adminLayout.editUser', {
            url: "/user/edit/:idUser",
            cache: false,
            views: {
                'content': {
                    templateUrl: "assets/html/admin/accounts/edituser.html",
                    controller: "EditUserCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('adminLayout.editUsers', {
            url: "/users",
            cache: false,
            views: {
                'content': {
                    templateUrl: "assets/html/admin/accounts/editusers.html",
                    controller: "EditUsersCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('adminLayout.addTeam', {
            url: "/team",
            cache: false,
            views: {
                'content': {
                    templateUrl: "assets/html/admin/accounts/addteam.html",
                    controller: "AddTeamCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('adminLayout.editTeams', {
            url: "/teams",
            cache: false,
            views: {
                'content': {
                    templateUrl: "assets/html/admin/accounts/editteams.html",
                    controller: "EditTeamsCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('adminLayout.editTeam', {
            url: "/team/edit/:idTeam",
            cache: false,
            views: {
                'content': {
                    templateUrl: "assets/html/admin/accounts/editteam.html",
                    controller: "EditTeamCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('adminLayout.addProject', {
            url: "/project",
            cache: false,
            views: {
                'content': {
                    templateUrl: "assets/html/admin/projects/addproject.html",
                    controller: "AddProjectCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('adminLayout.editProject', {
            url: "/project/edit/:idProject",
            cache: false,
            views: {
                'content': {
                    templateUrl: "assets/html/admin/projects/editproject.html",
                    controller: "EditProjectCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        }).state('adminLayout.editProjects', {
            url: "/projects",
            cache: false,
            views: {
                'content': {
                    templateUrl: "assets/html/admin/projects/editprojects.html",
                    controller: "EditProjectsCtrl",
                    resolve: {
                        user: ["LoginResolverService", function(resolver){
                            return resolver.checkLoggedLoginResolve();
                        }]
                    }
                }
            }
        });

        $urlRouterProvider.when('','/');
        $urlRouterProvider.otherwise('/');
    }
    /* END : router config function */

    exports.RouterConfig = RouterConfig
});