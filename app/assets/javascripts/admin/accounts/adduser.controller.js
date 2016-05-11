define(["angular"], function (angular) {
    "use strict";
    return {
        AddUserCtrl: function ($scope) {
        	$scope.greeting = "Hello World!";
            $scope.isNewUserFormSubmitted = false;
            $scope.newUser = {};
    
         	console.log("printing entry");
        	$scope.generatePassword = function(){
        		$scope.newUser.newPassword = Math.random().toString(36).substring(18);
        		$scope.newUser.newPassword1 = $scope.newUser.newPassword;
        	}

            $scope.createNewUser = function(){
                $scope.isNewUserFormSubmitted = true;
                if($scope.userForm.$valid){
                    console.log("envoyer l'utilisateur , formulaire valide");
                }
            }


            $scope.validatePassword = function(){
                if($scope.newUser.newPassword && $scope.newUser.newPassword1) {
                        $scope.userForm.newPassword1.$setValidity("validConfirm",$scope.newUser.newPassword === $scope.newUser.newPassword1);
                }
            }
        }
    };
});