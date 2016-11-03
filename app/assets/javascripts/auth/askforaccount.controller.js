/**
 * Created by akram.tabka on 19/10/2016.
 */
define(["angular"], function(angular) {
    "use strict";
    return {
        AskForAccountCtrl: function($scope, playRoutes, toastr) {
            $scope.isEmailSent = false;
            $scope.newaccount = {};
            $scope.askForAccount = function(newaccount){
                playRoutes.controllers.notifiers.MailNotifierController.askForAccount().post(newaccount).then(function (response) {
                    console.log("response", response.data);
                    $scope.isEmailSent = true;
                },function(error){
                    toastr.error(error.status +' : Arf, something went wrong!');
                });
            }
        }
    };

});