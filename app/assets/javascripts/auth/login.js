(function() {
    "use strict";
    angular.module('app').controller("LoginCtrl", LoginCtrl);

        function LoginCtrl($rootScope, $scope, playRoutes, $state, LoginService, toastr) {
            $scope.credentials = {};
            $scope.user = {};
            $scope.loggedIn = true;
            $rootScope.user = {};
            $scope.isHiddenLoginForm = false;
            $scope.login = function (credentials) {

                var creds = {
                    login: credentials.login,
                    password: CryptoJS.SHA256(credentials.password).toString()
                };

                LoginService.login(creds).then(function (user) {
                    if (LoginService.hasDefaultProject()) {
                        $state.go("layout.scenario");
                    } else {
                        $state.go("default");
                    }
                }, function (error) {
                    toastr.error('Invalid username or password!');
                });

            };
        }

})();