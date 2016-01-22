define(["angular"], function (angular) {
    "use strict";
    return {
        MainCtrl: function ($rootScope, $scope, playRoutes, $location) {
            playRoutes.controllers.Application.loadEnvConfiguration().get().then(function(response){
                $rootScope.jnlpHost = response.data || ""; 
            })
            $scope.logout = function () {
                playRoutes.controllers.Application.logout().get().then(function (response) {
                    $rootScope.user = "";
                    window.location.href = "/";
                });
            }
        }
    }
});