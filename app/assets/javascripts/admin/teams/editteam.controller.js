define(["angular"], function (angular) {
    "use strict";
    return {
        EditTeamCtrl: function ($scope,playRoutes, LoginService, toastr) {
        	playRoutes.controllers.TeamController.getAllTeams().get().then(function (response) {
				$scope.teamList = response.data;
				console.log("user list is : " , response.data);
			});
        }
    };
});