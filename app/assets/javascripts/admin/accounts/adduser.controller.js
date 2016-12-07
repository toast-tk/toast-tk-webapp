(function() {
    "use strict";

    angular.module("app").controller("AddUserCtrl", AddUserCtrl);

    function AddUserCtrl($scope, $q, playRoutes, toastr) {
            $scope.isNewUserFormSubmitted = false;
            $scope.newUser = {};
    
        	$scope.generatePassword = function(){
        		$scope.newUser.password = Math.random().toString(36).substring(18);
        		$scope.newUser.password1 = $scope.newUser.password;
        	}

            $scope.createNewUser = function(){
                $scope.isNewUserFormSubmitted = true;
                if($scope.userForm.$valid){
                    var selectedTeamList = [];
                    ($scope.newUser.teams|| []).forEach(function(team){
                        selectedTeamList.push(team); //TODO add object here !
                    });
                    $scope.newUser.teams = selectedTeamList ;
                    $scope.newUser.password = SHA256($scope.newUser.password).toString();
                    console.log("envoyer l'utilisateur , formulaire valide");
                    playRoutes.controllers.UserController.saveUser().post($scope.newUser).then(function () {
                        toastr.success('Saved !');
                        $scope.newUser = {};
                        $scope.userForm.$setPristine();
                        $scope.isNewUserFormSubmitted = false;
                    });
                }
            }

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

            $scope.validatePassword = function(){
                if($scope.newUser.password && $scope.newUser.password1) {
                        $scope.userForm.password1.$setValidity("validConfirm",$scope.newUser.password === $scope.newUser.password1);
                }
            }
        }

})();