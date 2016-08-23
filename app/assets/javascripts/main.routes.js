define(["angular", "exports"], function (angular, exports) {
    'use strict';

    RouterConfig.$inject = ["$stateProvider", "$urlRouterProvider"];

    function RouterConfig($stateProvider, $urlRouterProvider){

        $stateProvider.state('login', {
            url: "/",
            views: {
                'main': {
                    templateUrl: "assets/html/login.html",
                    controller: "LoginCtrl",
                    resolve:{
                        checkLoggedLogin : ["LoginResolverService", function (resolver){
                            return resolver.checkLoggedLoginResolve() ;
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
                        checkLoggedAndGetUser : ["LoginResolverService", function (resolver){
                            return resolver.checkLoggedAndGetUserResolve() ;
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
                    controller: "MainCtrl"
                }
            }
        }).state('project', {
            url: "/userproject",
            cache: false,
            views: {
                'main':{
                    templateUrl: "assets/html/projects.html",
                    controller: "MainProjectCtrl"
                }
            }
        }).state('layout.settings', {
            url: "settings",
            cache: false,
            views: {
                'content':{
                    templateUrl: "assets/html/settings/settings.html",
                    controller: "SettingsCtrl"
                }
            }
        }).state('layout.repository', {
            url: "repository",
            cache: false,
            views: {
                'content':{
                    templateUrl: "assets/html/repository/repository.html",
                    controller: "RepositoryCtrl"
                },
                resolve:{
                    checkDefaultProjectResolve : ["LoginResolverService", function (resolver){
                        return resolver.checkDefaultProjectResolve() ;
                    }]
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
                },
                resolve:{
                    checkDefaultProjectResolve : ["LoginResolverService", function (resolver){
                        return resolver.checkDefaultProjectResolve() ;
                    }]
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
                },
                resolve:{
                    checkDefaultProjectResolve : ["LoginResolverService", function (resolver){
                        return resolver.checkDefaultProjectResolve() ;
                    }]
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
                            checkLoggedAndGetUser : ["LoginResolverService", function (resolver){
                                return resolver.checkLoggedAndGetUserResolve() ;
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
            .state('adminLayout.editTeams', {
                url: "/teams",
                cache: false,
                views: {
                    'content': {
                        templateUrl: "assets/html/admin/accounts/editteams.html",
                        controller: "EditTeamsCtrl"
                    }
                }
            }).state('adminLayout.editTeam', {
                url: "/team/edit/:idTeam",
                cache: false,
                views: {
                    'content': {
                        templateUrl: "assets/html/admin/accounts/editteam.html",
                        controller: "EditTeamCtrl"
                    }
                }
            })
            .state('adminLayout.addProject', {
                url: "/project",
                cache: false,
                views: {
                    'content': {
                        templateUrl: "assets/html/admin/projects/addproject.html",
                        controller: "AddProjectCtrl"
                    }
                }
            })
            .state('adminLayout.editProject', {
                url: "/project/edit/:idProject",
                cache: false,
                views: {
                    'content': {
                        templateUrl: "assets/html/admin/projects/editproject.html",
                        controller: "EditProjectCtrl"
                    }
                }
            })
            .state('adminLayout.editProjects', {
                url: "/projects",
                cache: false,
                views: {
                    'content': {
                        templateUrl: "assets/html/admin/projects/editprojects.html",
                        controller: "EditProjectsCtrl"
                    }
                }
            });
        $urlRouterProvider.when('','/');
        $urlRouterProvider.otherwise('/');
    }
    /* END : router config function */

    exports.RouterConfig = RouterConfig


});