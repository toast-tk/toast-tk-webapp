define(["angular"], function(angular) {
    "use strict";

    return {
        MainProjectCtrl: function($rootScope, $scope, playRoutes, $state, LoginService, toastr) {
            var user = LoginService.currentUser();
            var promise = playRoutes.controllers.UserController.getUserProjects(user._id).get();
            promise.then(function(response){
                $scope.projectList = response.data || [];
            });

            $scope.selectProject = function(idProject) {
                LoginService.setUserProject(idProject).then(function () {
                    $state.go("layout.scenario");
                }, function (error) {
                    toastr.error('Invalid username or password!');
                });

            };
        }
    };

});