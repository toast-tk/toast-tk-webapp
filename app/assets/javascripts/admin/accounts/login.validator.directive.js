(function() {
  "use strict";
  angular.module("app").directive("login", Login);

  function Login($q, playRoutes) {
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
}

})();