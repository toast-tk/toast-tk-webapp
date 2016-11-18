(function() {
    "use strict";
    angular.module("app").controller("MainCtrl", MainCtrl);

    function MainCtrl($rootScope, $scope, playRoutes, $state) {
            playRoutes.controllers.Application.loadEnvConfiguration().get().then(function(response){
                $rootScope.jnlpHost = response.data || ""; 
            });
            
            $scope.goToState = function(stateName){
                $state.go(stateName);
                $scope.currentState = stateName ;
            };

            $scope.logout = function () {
                playRoutes.controllers.Application.logout().get().then(function (response) {
                    $rootScope.user = "";
                    window.location.href = "/";
                });
            }
        }
})();