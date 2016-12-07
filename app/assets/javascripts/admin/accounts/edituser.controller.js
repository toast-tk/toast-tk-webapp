(function() {
    "use strict";

    angular.module("app").controller("EditUserCtrl", EditUserCtrl);

    function EditUserCtrl($scope, playRoutes, toastr, $stateParams) {
            $scope.isNewUserFormSubmitted = false;
            $scope.user = {};

            playRoutes.controllers.UserController.user($stateParams.idUser).get().then(function (response) {
                $scope.user = response.data;
                console.log("user being edited is : " , response.data);
            });
    
            $scope.saveUser = function(){
                $scope.isNewUserFormSubmitted = true;
                if($scope.userForm.$valid){
                    var selectedTeamList = [];
                    ($scope.user.teams|| []).forEach(function(team){
                        selectedTeamList.push(team.id);
                    });
                    $scope.user.teams = selectedTeamList;
                    playRoutes.controllers.UserController.saveUser().post($scope.user).then(function () {
                        toastr.success('Saved !');
                        $scope.userForm.$setPristine();
                        $scope.isNewUserFormSubmitted = false;
                    });
                }
            };

            $scope.loadTeams = function(query){
                var defered = $q.defer();
                playRoutes.controllers.TeamController.getAllTeams().get().then(function(response){
                    var res = response.data || [];
                    res = res.filter(function (el) {
                      return el.name.toLowerCase().search(query.toLowerCase()) > -1;
                    });
                    defered.resolve(res);
                });
                return defered.promise;
            }

        }
})();