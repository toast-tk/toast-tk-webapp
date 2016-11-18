(function() {
    "use strict";
    angular.module("app").controller("EditProjectCtrl", EditProjectCtrl);

    function EditProjectCtrl($scope, playRoutes, LoginService, toastr, $stateParams) {
            $scope.isNewUserFormSubmitted = false;
            $scope.newProject = {};

            playRoutes.controllers.ProjectController.getProject($stateParams.idProject).get().then(function (response) {
                $scope.newProject = response.data;
                console.log("user being edited is : " , response.data);
            });

            $scope.save = function(){
                $scope.isNewProjectFormSubmitted = true;
                if($scope.projectForm.$valid){
                    playRoutes.controllers.ProjectController.saveProject().post($scope.newProject).then(function (response) {
                        if(response.status === 200){
                            toastr.success('Project Created !');
                            $scope.newProject = {};
                            $scope.projectForm.$setPristine();
                            $scope.isNewProjectFormSubmitted = false;
                        } else {
                            toastr.error('Error: '+ response.data);
                        }
                    });
                }
            }


        }

})();