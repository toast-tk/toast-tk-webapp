define(["angular"], function(angular) {
    "use strict";

    return {
        MainProjectCtrl: function($rootScope, $scope, playRoutes, $state, LoginService, toastr) {
            $scope.user = LoginService.currentUser();
            var promise = playRoutes.controllers.UserController.getUserProjects($scope.user._id).get();
            promise.then(function(response){
                $scope.projectList = response.data || [];
            });

            $scope.selectProject = function(idProject) {
                LoginService.setUserProject(idProject).then(function () {
                    LoginService.getUserProject(idProject).then(function(){
                        $state.go("layout.scenario");
                    })
                }, function (error) {
                    toastr.error('Error: Setting default project failed !');
                });
            };

            $scope.logout = function(){
                LoginService.logout();
                $state.go('login');
            }

            $scope.goToState = function(stateName){
                $state.go(stateName);
            }
        }
    };

});