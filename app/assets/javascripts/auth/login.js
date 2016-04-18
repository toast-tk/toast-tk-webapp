define(["angular","CryptoJS"], function(angular, CryptoJS) {
  "use strict";

  return {
    LoginCtrl: function($rootScope, $scope, playRoutes, $state, LoginService, toastr) {
      $scope.credentials = {};
      $scope.user = {};
      $scope.loggedIn = true;
      $rootScope.user = {};
      $scope.login = function(credentials) {
        var creds = { login :  credentials.login,
                      password : CryptoJS.SHA1(credentials.password).toString()
                    };

                    LoginService.login(creds).then(function (user) {
                      $state.go("layout.scenario");
                    }, function (error) {
                      toastr.error('Invalid username or password!');
                    });

      };
    }
  };

});