define(["angular"], function (angular, SHA256) {
    "use strict";
    return {
        AddProjectCtrl: function ($scope, $q, playRoutes, toastr) {
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
    };
});