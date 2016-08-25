define(["angular"], function(angular) {
	'use strict';
	 return {
        AdminLayoutCtrl: AdminLayoutCtrl
    	}


	AdminLayoutCtrl.$inject = ['$scope','$sideSplit','$state', 'user', 'defaultProject'];

	function AdminLayoutCtrl($scope, $sideSplit, $state, user, defaultProject) {
		$scope.isCollapsed = false;
		$scope.user = user ;
        $scope.project = defaultProject;

		$sideSplit.open({ 
                        templateUrl: 'assets/html/admin/layout/sidebar.view.html',
                        controller: 'AdminSidebarMenuCtrl',
                        appendTo : angular.element('#sidebarmenu'),
                        width : "225px",
                        position : "left"
        });

		$sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(isCollapsedRetour){
				$scope.isCollapsed = !$scope.isCollapsed ;
		});


		$scope.logout = function(){
			LoginService.logout();
			$state.go('login');
		}

        $scope.goToState = function(stateName){
            $state.go(stateName);
        }
	}

});