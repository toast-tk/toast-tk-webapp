define(["angular"], function(angular) {
	'use strict';
	 return {
        AdminLayoutCtrl: AdminLayoutCtrl
    	}


	AdminLayoutCtrl.$inject = ['$scope','$sideSplit','$state', 'user', 'defaultProject', 'LoginService'];

	function AdminLayoutCtrl($scope, $sideSplit, $state, user, defaultProject, LoginService) {
		$scope.isCollapsed = false;
		$scope.user = user ;
        $scope.project = defaultProject;
        $scope.editProfile = editProfile;
        $scope.logout = logout;
        $scope.goToState = goToState;


        $sideSplit.open({
            templateUrl: 'assets/html/admin/layout/sidebar.view.html',
            controller: 'AdminSidebarMenuCtrl',
            scope: $scope,
            appendTo : angular.element('#sidebarmenu'),
            width : "225px",
            position : "left"
        });
        $sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(isCollapsedRetour){
            $scope.isCollapsed = !$scope.isCollapsed ;
        });


        function editProfile(){
            $state.go("adminLayout.editUser", {idUser: $scope.user._id});
        }

		function logout(){
			LoginService.logout();
			$state.go('login');
		}

        function goToState(stateName){
            $state.go(stateName);
        }
	}

});