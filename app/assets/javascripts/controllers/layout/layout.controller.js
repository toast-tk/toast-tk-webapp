define(["angular"], function(angular) {
	'use strict';
	 return {
        LayoutCtrl: LayoutCtrl
    	}


	LayoutCtrl.$inject = ['$scope','$sideSplit','$state','$http','$timeout'];

	function LayoutCtrl($scope, $sideSplit, $state, $http, $timeout) {
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


		$scope.logout = function(){
				$http.get('/logout').then(function(){
					$state.transitionTo($state.current, {}, {location : "replace", reload: true});
			});
		}

		/*
		$scope.collapse = function(){
			 $sideSplit.close({ 
                             id: angular.element('#sidebarmenu'),
                             message :"collapsed!"
                      });
		};*/
	}

});