define(["angular"], function (angular) {
    "use strict";
    return {
        EditUserCtrl: function ($scope) {
        	$scope.greeting = "Hello World!";
        	console.log("printing entry");
        	$scope.generatePassword = function(){
        		$scope.newPassword = Math.random().toString(36).substring(18);
        		$scope.newPassword1 = $scope.newPassword;
        	}
        	
        	console.log("the new pasword is : ", $scope.newPassword);
        }
    };
});