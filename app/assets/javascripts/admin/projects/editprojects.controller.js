define(["angular"], function (angular) {
    "use strict";
    return {
        EditProjectsCtrl: function ($scope, playRoutes, toastr, $state) {
        	playRoutes.controllers.ProjectController.getAllProjects().get().then(function (response) {
				$scope.projectList = response.data;
			});

            $scope.editProject = function(id){
                $state.go("adminLayout.editProject", {idProject: id});
            }
        }
    };
});