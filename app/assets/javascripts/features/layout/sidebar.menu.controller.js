(function() {
	'use strict';

	angular.module("app").controller("SidebarMenuCtrl", SidebarMenuCtrl);

	SidebarMenuCtrl.$inject = ['$scope', '$state','$sideSplit'];

	function SidebarMenuCtrl($scope, $state, $sideSplit) {
		$scope.currentState = $state.current.name ;
		$scope.collapse = function(){
			$scope.isCollapsed = !$scope.isCollapsed ;
			 $sideSplit.collapse({ 
                             id: angular.element('#sidebarmenu'),
                             message :"collapsed!"
                      });
		};

		$scope.goToState = function(stateName){
			$state.go(stateName);
			$scope.currentState = stateName ;
		}
	}

})();