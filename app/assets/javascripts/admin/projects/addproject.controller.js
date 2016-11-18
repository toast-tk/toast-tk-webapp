(function() {
    "use strict";
    angular.module("app").controller("AddProjectCtrl", AddProjectCtrl);

    function AddProjectCtrl($scope, playRoutes, toastr) {
            $scope.createNewProject = function(){
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