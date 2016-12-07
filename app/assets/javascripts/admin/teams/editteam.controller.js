(function() {
    "use strict";

    angular.module("app").controller("EditTeamCtrl", EditTeamCtrl);

    function EditTeamCtrl($scope, playRoutes, $stateParams, toastr, $q) {
            $scope.isNewUserFormSubmitted = false;
            $scope.newTeam = {};

            playRoutes.controllers.TeamController.getTeam($stateParams.idTeam).get().then(function (response) {
                $scope.newTeam = response.data;
                console.log("user being edited is : " , response.data);
            });

            $scope.saveTeam = function(){
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
            };

            $scope.loadProjects = function($query){
                var defered = $q.defer();
                playRoutes.controllers.ProjectController.getAllProjects().get().then(function(response){
                    var res = response.data || [];
                    res = res.filter(function (el) {
                      return el.name.contains($query);
                    });
                    defered.resolve(res);
                });
                return defered.promise;
            }

        }
})();