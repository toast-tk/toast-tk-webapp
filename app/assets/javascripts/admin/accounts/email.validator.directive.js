(function() {
    "use strict";
    angular.module("app").directive("email", Email);

    function Email($q, playRoutes) {
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
})();