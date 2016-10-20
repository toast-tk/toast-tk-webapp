/**
 * Created by akram.tabka on 19/10/2016.
 */
define(["angular"], function(angular) {
    "use strict";
    return {
        AskForAccountCtrl: function($scope, playRoutes) {
            $scope.newaccount = {};
            $scope.askForAccount = function(newaccount){
                playRoutes.controllers.notifiers.MailNotifierController.askForAccount().post(newaccount).then(function (response) {
                    console.log("response", response.data);
                });
            }
        }
    };

});