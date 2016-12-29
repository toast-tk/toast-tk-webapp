(function() {
	"use strict";

	angular.module("app").controller("SidebarMenuCtrl", SidebarMenuCtrl);

	SidebarMenuCtrl.$inject = ["$scope", "$sideSplit"];

	function SidebarMenuCtrl($scope, $sideSplit) {
		$scope.collapse = function(){
			$scope.isCollapsed = !$scope.isCollapsed ;
			 $sideSplit.collapse({ 
                             id: angular.element("#sidebarmenu"),
                             message :"collapsed!"
                      });
		};
	}

})();