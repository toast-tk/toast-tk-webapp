define(["angular"], function (angular) {
    "use strict";
    return {
        ResolversService : function (LoginService, $state, $q, playRoutes) {

            return {
                checkLoggedLoginResolve : checkLoggedLoginResolve,
                checkLoggedAndGetUserResolve : checkLoggedAndGetUserResolve,
                checkDefaultProjectResolve: checkDefaultProjectResolve
            };

            // --------------------- Resolvers ----------------------
            function checkLoggedLoginResolve() {
                LoginService.sync()
                var deferred = $q.defer();
                if (LoginService.isAuthenticated()) {
                    if (LoginService.hasDefaultProject() === false) {
                        $state.go("project");
                        deferred.reject();
                    }else{
                        //$state.go("layout.scenario");
                        deferred.resolve();
                    }
                }else{
                    deferred.resolve();
                }
                return deferred.promise;
            }

            function checkLoggedAndGetUserResolve(){
                var deferred = $q.defer();
                LoginService.sync()
                if (LoginService.isAuthenticated() === true) {
                    var user = LoginService.currentUser();
                    deferred.resolve(user);
                }else{
                    deferred.reject();
                }
                return deferred.promise;
            }

            function checkDefaultProjectResolve(user){
                var deferred = $q.defer();
                LoginService.sync()
                if (!LoginService.isAuthenticated()) {
                    $state.go("login");
                    deferred.reject();
                }
                else if (!LoginService.hasDefaultProject()) {
                    $state.go("project");
                    deferred.reject();
                }else{
                    var idProject = LoginService.getDefaultProjectId();
                    playRoutes.controllers.ProjectController.getProject(idProject).get().then(function(response){
                        var project = response.data;
                        deferred.resolve(project);
                    }, function(error){
                        console.log(error);
                        $state.go("project");
                        deferred.reject();
                    });
                }
                return deferred.promise;
            }
        }
    }
});