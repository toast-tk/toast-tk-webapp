(function() {
    "use strict";
    
    angular.module("app").controller("EditUsersCtrl", EditUsersCtrl);

    function EditUsersCtrl($scope, playRoutes, LoginService, toastr, $state) {
        $scope.user = LoginService.currentUser();

        playRoutes.controllers.UserController.getAllUsers().get().then(function (response) {
            $scope.userList = response.data;
            console.log("user being edited is : ", response.data);
        });

        $scope.generatePassword = function () {
            $scope.newPassword = Math.random().toString(36).substring(18);
            $scope.newPassword1 = $scope.newPassword;
        };

        $scope.editUser = function (id) {
            $state.go("adminLayout.editUser", {idUser: id});
        };

        $scope.deleteUser = function (id) {
            playRoutes.controllers.UserController.deleteUser(id).delete().then(function (response) {
                console.log("deleted: ", response.data);
                if (response.status === 200) {
                    toastr.success('Account removed successfully !');
                    $scope.userList.forEach(function (user, index) {
                        if (user._id == id) {
                            $scope.userList.splice(index, 1);
                        }
                    });
                }
            });
        }
    }
})();