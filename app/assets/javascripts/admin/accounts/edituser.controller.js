define(["angular"], function (angular) {
    "use strict";
    return {
        EditUserCtrl: function ($scope,playRoutes, LoginService, toastr) {
        	$scope.greeting = "Hello World!";
        	console.log("printing entry");

            $scope.user  = LoginService.currentUser();

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
                    if(response.status === 200){
                        toastr.success('Account removed successfully !');
                        $scope.userList.forEach(function(user,index){
                            if(user.id == id){
                                $scope.userList.splice(index,1);
                            }
                        });
                    }
				});
			}
        	
        	console.log("the new pasword is : ", $scope.newPassword);
        }
    };
});