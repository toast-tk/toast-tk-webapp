define(["angular"], function (angular) {
    "use strict";
    return {
        EditUserCtrl: function ($scope,playRoutes) {
        	$scope.greeting = "Hello World!";
        	console.log("printing entry");

			playRoutes.controllers.Users.getAllUsers().get().then(function (response) {
				$scope.userList = response.data;
				console.log("user list is : " , response.data);
			});
			
        	$scope.generatePassword = function(){
        		$scope.newPassword = Math.random().toString(36).substring(18);
        		$scope.newPassword1 = $scope.newPassword;
        	}

			$scope.deleteUser = function(id){
				playRoutes.controllers.Users.deleteUser(id).delete().then(function (response) {
					console.log("deleted: " , response.data);
				});
			}
        	
        	console.log("the new pasword is : ", $scope.newPassword);
        }
    };
});