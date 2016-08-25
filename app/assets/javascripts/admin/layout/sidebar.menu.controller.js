define(["angular"], function(angular) {
    'use strict';
    return {
        AdminSidebarMenuCtrl: AdminSidebarMenuCtrl
    }


    AdminSidebarMenuCtrl.$inject = ['$scope', '$state','$sideSplit'];

    function AdminSidebarMenuCtrl($scope, $state, $sideSplit) {
        $scope.isCollapsed = false;
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

});