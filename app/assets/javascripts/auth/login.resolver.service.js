define(["angular"], function (angular) {
    "use strict";
    return {
        ResolversService : function (LoginService, $state, $q) {

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
                       $state.go("layout.scenario");
                       deferred.resolve();
                    }
                }
                return deferred.promise;
            }

            function checkLoggedAndGetUserResolve(){
                var deferred = $q.defer();
                LoginService.sync()
                if (LoginService.isAuthenticated() === true) {
                    var user  = LoginService.currentUser();
                    deferred.resolve(user);
                } else {
                    $state.go("login");
                    deferred.reject();
                }
                return deferred.promise;
            }

            function checkDefaultProjectResolve(){
                var deferred = $q.defer();
                LoginService.sync()
                if (LoginService.hasDefaultProject() === false) {
                    $state.go("project");
                }
                deferred.resolve();
                return deferred.promise;
            }
        }
    }
});