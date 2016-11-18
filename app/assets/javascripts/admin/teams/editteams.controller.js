(function() {
    "use strict";

    angular.module("app").controller("EditTeamsCtrl", EditTeamsCtrl);

        function EditTeamsCtrl($scope,playRoutes, $state) {
        	playRoutes.controllers.TeamController.getAllTeams().get().then(function (response) {
				$scope.teamList = response.data;
				console.log("team list is : " , response.data);
			});

            $scope.editTeam = function(id){
                $state.go("adminLayout.editTeam", {idTeam: id});
            }
        }
})();