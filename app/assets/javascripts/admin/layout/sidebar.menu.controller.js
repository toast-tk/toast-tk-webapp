(function() {
    'use strict';
    
    angular.module("app").controller("AdminSidebarMenuCtrl", AdminSidebarMenuCtrl);

    AdminSidebarMenuCtrl.$inject = ['$scope', '$state','$sideSplit'];

    function AdminSidebarMenuCtrl($scope, $state, $sideSplit) {
        $scope.isCollapsed = false;
        $scope.collapse = function(){
            $scope.isCollapsed = !$scope.isCollapsed ;
            $sideSplit.collapse({
                id: angular.element('#sidebarmenu'),
                message :"collapsed!"
            });
        };
    }

})();