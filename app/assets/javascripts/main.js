(function() {
    "use strict";

    var app = angular.module("app",
        ['ui.router', "play.routing", "ngAnimate",
            "tk.components", "tk.services", "tk.chart.utils",
            "ui.sortable", "ngProgress", "ui.tree", "ui.bootstrap",
            "xeditable", "sidesplit", "webix","angucomplete-alt",
            "toastr","ngTagsInput", "angularjs-dropdown-multiselect",
            "chart.js", "bootstrapLightbox"]);

    app.run(['editableOptions', '$rootScope', function(editableOptions, $rootScope) {
        editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
        editableOptions.mode = 'popup';
        $rootScope.loaded = true;
    }]);

    app.config(['LightboxProvider', function (LightboxProvider) {
        LightboxProvider.fullScreenMode = true;
    }]);

    app.config(['$httpProvider',
        function($httpProvider) {
            $httpProvider.interceptors.push(['$q',
                function($q) {
                    return {
                        'request': function(config){
                            config.headers['Authorization'] = JWT.get();
                            return config;
                        },
                        'responseError': function(rejection){
                            if (rejection.status === 401) {
                                console.log("Action is not authorised, please contact your administrator.")
                                JWT.forget();
                                return $q.reject(rejection);
                            }
                            return $q.reject(rejection);
                        }
                    };
                }]);
        }]);

})();