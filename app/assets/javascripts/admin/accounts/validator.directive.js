define(["angular"], function (angular) {
  "use strict";
  return {
    Login: function($q, $timeout, playRoutes) {
      return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
          var logins = [];

          playRoutes.controllers.UserController.getAllUsers().get().then(function (response) {
              response.data.forEach(function(user){
                logins.push(user.login);
              })              
          });

          ctrl.$asyncValidators.login = function(modelValue, viewValue) {

            if (ctrl.$isEmpty(modelValue)) {
          // consider empty model valid
          return $q.when();
        }

        var def = $q.defer();

          if (logins.indexOf(modelValue) === -1) {
            // The login is available
            def.resolve();
          } else {
            def.reject();
          }

        return def.promise;
      };
    }
  };
},
    Email: function($q, $timeout, playRoutes) {
      return {
        require: 'ngModel',
        link: function(scope, elm, attrs, ctrl) {
          var emails = [];

          playRoutes.controllers.UserController.getAllUsers().get().then(function (response) {
              response.data.forEach(function(user){
                emails.push(user.email);
              })              
          });

          ctrl.$asyncValidators.email = function(modelValue, viewValue) {

            if (ctrl.$isEmpty(modelValue)) {
          // consider empty model valid
          return $q.when();
        }

        var def = $q.defer();

          if (emails.indexOf(modelValue) === -1) {
            // The email is available
            def.resolve();
          } else {
            def.reject();
          }

        return def.promise;
      };
    }
  };
}
};
});