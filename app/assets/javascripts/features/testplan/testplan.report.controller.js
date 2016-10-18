define(["angular"], function (angular) {
    "use strict";
    return {
        TestPlanReportCtrl: function ($rootScope, $scope, playRoutes,
                                ngProgress, $window, $timeout, $stateParams,
                                $sideSplit, LayoutService,
                                defaultProject, ChartUtils) {

            $scope.defaultProject = defaultProject
            $scope.view_tab = 'tab1';

            $scope.changeTab = function(tab) {
                $scope.view_tab = tab;
            }

            $scope.getCampaignTotalOk = function(campaign){
                return ChartUtils.getCampaignTotalOk(campaign);
            }

            $scope.getCampaignTotalKo = function(campaign){
                return ChartUtils.getCampaignTotalKo(campaign);
            }

            function __init__() {
                playRoutes.controllers.TestPlanController.loadProjectReport($stateParams.reportName).get().then(function (response) {
                    $scope.report = response.data || {};
                    $scope.report.line = ChartUtils.buildLineChart($scope.report);
                    $scope.report.pie = ChartUtils.buildPieChart($scope.report);
                });
            }

            __init__();
        }
    };
});