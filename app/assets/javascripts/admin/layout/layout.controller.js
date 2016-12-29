(function() {
	"use strict";

    angular.module("app").controller("AdminLayoutCtrl", AdminLayoutCtrl);

    AdminLayoutCtrl.$inject = ["$scope","$sideSplit","$state", "user", "defaultProject", "LoginService"];

	function AdminLayoutCtrl($scope, $sideSplit, $state, user, defaultProject, LoginService) {
		$scope.isCollapsed = false;
		$scope.user = user ;
        $scope.project = defaultProject;

        $sideSplit.open({
            templateUrl: "assets/html/admin/layout/sidebar.view.html",
            controller: "AdminSidebarMenuCtrl",
            scope: $scope,
            appendTo : angular.element("#sidebarmenu"),
            width : "225px",
            position : "left"
        });

        $sideSplit.addCollapseCallBack(angular.element("#sidebarmenu"), function(isCollapsedRetour){
            $scope.isCollapsed = !$scope.isCollapsed ;
        });

        $scope.getUserInitials = function(){
            if(user.isAdmin === true){
                return user.firstName;
            } else {
                return user.firstName.substring(0, 1) + user.lastName.substring(0, 1);
            }
        };

        $scope.editProfile = function (){
            $state.go("adminLayout.editUser", {idUser: $scope.user._id});
        };

        $scope.logout = function (){
			LoginService.logout();
			$state.go("login");
		};
	}

})();