(function() {
    "use strict";
    angular.module("app").controller("EditProjectsCtrl", EditProjectsCtrl);

    function EditProjectsCtrl($scope, playRoutes, $state) {
        	playRoutes.controllers.ProjectController.getAllProjects().get().then(function (response) {
				$scope.projectList = response.data;
			});

            $scope.editProject = function(id){
                $state.go("adminLayout.editProject", {idProject: id});
            }
        }

})();