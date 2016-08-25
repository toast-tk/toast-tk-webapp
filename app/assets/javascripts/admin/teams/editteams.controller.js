define(["angular"], function (angular) {
    "use strict";
    return {
        EditTeamsCtrl: function ($scope,playRoutes, $state, toastr) {
        	playRoutes.controllers.TeamController.getAllTeams().get().then(function (response) {
				$scope.teamList = response.data;
				console.log("team list is : " , response.data);
			});

            $scope.editTeam = function(id){
                $state.go("adminLayout.editTeam", {idTeam: id});
            }
        }
    };
});