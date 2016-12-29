(function() {
    "use strict";
    angular.module("app").controller("MainCtrl", MainCtrl);

    function MainCtrl($rootScope, $scope, playRoutes) {
            playRoutes.controllers.Application.loadEnvConfiguration().get().then(function(response){
                $rootScope.jnlpHost = response.data || ""; 
            });

            $scope.logout = function () {
                playRoutes.controllers.Application.logout().get().then(function (response) {
                    $rootScope.user = "";
                    window.location.href = "/";
                });
            }
        }
})();