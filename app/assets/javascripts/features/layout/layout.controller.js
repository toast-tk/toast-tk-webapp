(function() {
	'use strict';

	angular.module("app").controller("LayoutCtrl", LayoutCtrl);

	LayoutCtrl.$inject = ['$scope','$sideSplit','$state', 'LoginService', 'user', 'defaultProject'];

	function LayoutCtrl($scope, $sideSplit, $state, LoginService, user, defaultProject) {
		$scope.isCollapsed = false;
		$scope.user = user;
        $scope.project = defaultProject;

		$sideSplit.open({ 
                        templateUrl: 'assets/html/layout/sidebar.view.html',
                        controller: 'SidebarMenuCtrl',
                        scope: $scope,
                        appendTo : angular.element('#sidebarmenu'),
                        width : "225px",
                        position : "left"
        });

		$sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(isCollapsedRetour){
				$scope.isCollapsed = !$scope.isCollapsed ;
		});

		$scope.getUserInitials = function(){
			if(user.isAdmin === true){
				return user.firstName;
			} else {
				return user.firstName.substring(0, 1) + user.lastName.substring(0, 1);
			}
		};

        $scope.editProfile = function(){
            $state.go("adminLayout.editUser", {idUser: $scope.user._id});
        };

		$scope.logout = function(){
			LoginService.logout();
			$state.go('login');
		};
	}

})();