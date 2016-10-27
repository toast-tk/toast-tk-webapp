define(["angular","CryptoJS/sha256"], function(angular, SHA256) {
    "use strict";

    return {
        LoginCtrl: function($rootScope, $scope, playRoutes, $state, LoginService, toastr) {
            $scope.credentials = {};
            $scope.user = {};
            $scope.loggedIn = true;
            $rootScope.user = {};
            $scope.isHiddenLoginForm = false;
            $scope.login = function(credentials) {

                var creds = {
                    login :  credentials.login,
                    password : SHA256(credentials.password).toString()
                };

                LoginService.login(creds).then(function (user) {
                    if(LoginService.hasDefaultProject()){
                        $state.go("layout.scenario");
                    }else{
                        $state.go("default");
                    }
                }, function (error) {
                    toastr.error('Invalid username or password!');
                });

            };
        }
    };

});