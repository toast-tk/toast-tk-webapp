(function() {
    "use strict";

    angular.module("app").controller("TestPageReportCtrl", TestPageReportCtrl);

    function TestPageReportCtrl($scope, playRoutes,$stateParams,defaultProject, report, Lightbox) {
        $scope.testPlan = report.testPlan;
        function __init__() {
            playRoutes.controllers.TestPlanController.loadTestReport($stateParams.reportName, $stateParams.iteration,
                $stateParams.testName, defaultProject._id).get().then(function (response) {
                $scope.report = response.data || {};
            });
        }
        $scope.displayImage = function(line){
            Lightbox.openModal([{
                'url': "data:image/png;base64," + line.screenshot,
                'caption': "Screenshot for step: " + line.test
            }], 0);
        };
        __init__();
    }

})();