define(["angular"], function(angular) {
	'use strict';
	 return {
        LayoutCtrl: LayoutCtrl
    	}


	LayoutCtrl.$inject = ['$scope','$sideSplit','$state', 'LoginService', 'user', 'defaultProject'];

	function LayoutCtrl($scope, $sideSplit, $state, LoginService, user, defaultProject) {
		$scope.isCollapsed = false;
		$scope.user = user;
        $scope.project = defaultProject;

		$sideSplit.open({ 
                        templateUrl: 'assets/html/layout/sidebar.view.html',
                        controller: 'SidebarMenuCtrl',
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