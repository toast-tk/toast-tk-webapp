define(["angular","CryptoJS/sha256"], function (angular, SHA256) {
    "use strict";
    return {
        AddUserCtrl: function ($scope, $q, playRoutes, toastr) {
        	$scope.greeting = "Hello World!";
            $scope.isNewUserFormSubmitted = false;
            $scope.newUser = {};
    
         	console.log("printing entry");
        	$scope.generatePassword = function(){
        		$scope.newUser.password = Math.random().toString(36).substring(18);
        		$scope.newUser.password1 = $scope.newUser.password;
        	}

            $scope.createNewUser = function(){
                $scope.isNewUserFormSubmitted = true;
                if($scope.userForm.$valid){
                    var selectedTeamList = [];
                    ($scope.newUser.teams|| []).forEach(function(team){
                        selectedTeamList.push(team.name); //TODO add object here !
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

            $scope.loadTeams = function(){
                var teamNameList =  [];
                return playRoutes.controllers.TeamController.getAllTeams().get();
            }

            $scope.validatePassword = function(){
                if($scope.newUser.password && $scope.newUser.password1) {
                        $scope.userForm.password1.$setValidity("validConfirm",$scope.newUser.password === $scope.newUser.password1);
                }
            }
        }
    };
});