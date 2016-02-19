define(["angular"], function(angular) {
	'use strict';
	 return {
        LayoutCtrl: LayoutCtrl
    	}


	LayoutCtrl.$inject = ['$scope','$sideSplit'];

	function LayoutCtrl($scope, $sideSplit) {
				$scope.isCollapsed = false;

		$sideSplit.open({ 
                        templateUrl: 'assets/html/layout/sidebar.view.html',
                        controller: 'SidebarMenuCtrl',
                        appendTo : angular.element('#sidebarmenu'),
                        width : "225px",
                        position : "left",
        });

		$sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(isCollapsedRetour){
				$scope.isCollapsed = !$scope.isCollapsed ;
		});

		/*console.log("hello");

		$scope.collapse = function(){
			 $sideSplit.close({ 
                             id: angular.element('#sidebarmenu'),
                             message :"collapsed!"
                      });
		};*/
	}

});