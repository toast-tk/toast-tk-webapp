define(["angular"], function(angular) {
	'use strict';
	 return {
        SidebarMenuCtrl: SidebarMenuCtrl
    	}


	SidebarMenuCtrl.$inject = ['$scope'];

	function SidebarMenuCtrl($scope) {
		$scope.isCollapsed = false;
		console.log("hello");
		$scope.collapse = function(){
			$scope.isCollapsed = !$scope.isCollapsed ;
		};
	}

});