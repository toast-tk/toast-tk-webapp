define(["angular"], function (angular) {
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
                    $scope.newUser.teams.forEach(function(team){
                        selectedTeamList.push(team.id);
                    });
                    $scope.newUser.teams = selectedTeamList ;
                    $scope.newUser.password = CryptoJS.SHA1($scope.newUser.password).toString()
                    console.log("envoyer l'utilisateur , formulaire valide");
                    playRoutes.controllers.Users.saveUser().post($scope.newUser).then(function () {
                        toastr.success('Saved !');
                        $scope.newUser = {};
                        $scope.userForm.$setPristine();
                        $scope.isNewUserFormSubmitted = false;
                    });
                }
            }

            $scope.loadTeams = function(){
                var teamNameList =  [];
                return playRoutes.controllers.TeamController.getAllTeams().get()

                /*.then(function (response) {
                     response.data.forEach(function(team){
                        teamNameList.push({text : team.name});
                     });
                    
                    deferred.resolve(teamNameList);
                });
                var deferred = $q.defer();
                return deferred.promise;*/
            }

            $scope.validatePassword = function(){
                if($scope.newUser.password && $scope.newUser.password1) {
                        $scope.userForm.password1.$setValidity("validConfirm",$scope.newUser.password === $scope.newUser.password1);
                }
            }
        }
    };
});