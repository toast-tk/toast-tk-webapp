(function(){
    "use strict";

    angular.module("app").service("LoginResolverService", ResolversService);

    function ResolversService(LoginService, $state, $q, playRoutes) {

            return {
                checkLoggedLoginResolve : checkLoggedLoginResolve,
                checkLoggedAndGetUserResolve : checkLoggedAndGetUserResolve,
                checkDefaultProjectResolve: checkDefaultProjectResolve,
                checkSelectedTestPlanResolve: checkSelectedTestPlanResolve
            };

            // --------------------- Resolvers ----------------------
            function checkLoggedLoginResolve() {
                LoginService.sync();
                var deferred = $q.defer();
                if (LoginService.isAuthenticated()) {
                    if (LoginService.hasDefaultProject() === false) {
                        $state.go("default");
                        deferred.reject();
                    } else {
                        deferred.resolve();
                    }
                } else {
                    deferred.resolve();
                }
                return deferred.promise;
            }

            function checkLoggedAndGetUserResolve(){
                var deferred = $q.defer();
                LoginService.sync();
                if (LoginService.isAuthenticated() === true) {
                    var user = LoginService.currentUser();
                    deferred.resolve(user);
                } else {
                    deferred.reject();
                }
                return deferred.promise;
            }

            function checkSelectedTestPlanResolve(reportName, idProject){
                var deferred = $q.defer();
                playRoutes.controllers.TestPlanController.loadProjectReport(idProject, reportName).get().then(function (response) {
                    var report = response.data;
                    deferred.resolve(report);
                }, function(error){
                    deferred.reject();
                });
                return deferred.promise;
            }

            function checkDefaultProjectResolve(user){
                var deferred = $q.defer();
                LoginService.sync();
                if (!LoginService.isAuthenticated()) {
                    $state.go("login");
                    deferred.reject();
                }
                else if (!LoginService.hasDefaultProject()) {
                    $state.go("default");
                    deferred.reject();
                }else{
                    var idProject = LoginService.getDefaultProjectId();
                    playRoutes.controllers.ProjectController.getProject(idProject).get().then(function(response){
                        var selectedProject = response.data;
                        deferred.resolve(selectedProject);
                    }, function(error){
                        console.log(error);
                        $state.go("default");
                        deferred.reject();
                    });
                }
                return deferred.promise;
            }
        }
})();