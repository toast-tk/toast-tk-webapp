define(["angular"], function (angular) {
    "use strict";
    return {
        AddTeamCtrl: function ($scope, playRoutes, LoginService, toastr) {
            $scope.isNewUserFormSubmitted = false;
            $scope.newTeam = {};

            $scope.createNewTeam = function(){
                $scope.isNewTeamFormSubmitted = true;
                if($scope.teamForm.$valid){
                    var selectedProjectList = [];
                    ($scope.newTeam.projects|| []).forEach(function(project){
                        selectedProjectList.push(project); //TODO add object here !
                    });
                    $scope.newTeam.projects = selectedProjectList ;
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

            $scope.loadProjects = function(){
                return playRoutes.controllers.ProjectController.getAllProjects().get();
            }

        }
    };
});