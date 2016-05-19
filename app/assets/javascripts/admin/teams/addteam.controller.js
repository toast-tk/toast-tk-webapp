define(["angular"], function (angular) {
    "use strict";
    return {
        AddTeamCtrl: function ($scope, playRoutes, LoginService, toastr) {
            var user  = LoginService.currentUser();

        	$scope.createNewTeam = function(){
                $scope.isNewTeamFormSubmitted = true;
                if($scope.teamForm.$valid){
                    $scope.newTeam.admin = user.id ;
                    playRoutes.controllers.TeamController.saveTeam().post($scope.newTeam).then(function (response) {
                        if(response.status === 200){
                            toastr.success('Team Created !');
                            $scope.newTeam = {};
                            $scope.teamForm.$setPristine();
                            $scope.isNewTeamFormSubmitted = false;
                        } else {
                            toastr.error('Error: '+ response.data);
                        }
                       
                    });
                }
            }

        }
    };
});