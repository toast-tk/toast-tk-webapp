define(["angular"], function(angular) {
	'use strict';
	 return {
        SidebarMenuCtrl: SidebarMenuCtrl
    	}


	SidebarMenuCtrl.$inject = ['$scope','$sideSplit'];

	function SidebarMenuCtrl($scope,$sideSplit) {
		$scope.isCollapsed = false;
		$scope.collapse = function(){
			$scope.isCollapsed = !$scope.isCollapsed ;
			 $sideSplit.collapse({ 
                             id: angular.element('#sidebarmenu'),
                             message :"collapsed!"
                      });
		};
	}

});