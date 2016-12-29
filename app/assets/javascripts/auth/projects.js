(function() {
    "use strict";
    
    angular.module("app").controller("MainProjectCtrl", MainProjectCtrl);

    function MainProjectCtrl($scope, playRoutes, $state, LoginService, toastr, user) {
            $scope.user = user;

            $scope.getUserInitials = function(){
                if(user.isAdmin === true){
                    return user.firstName;
                } else {
                    return user.firstName.substring(0, 1) + user.lastName.substring(0, 1);
                }
            };

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
            };
        }

})();