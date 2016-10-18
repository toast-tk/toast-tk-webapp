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


            $scope.getTotalDuration = function(testPlan){
                var total = 0;
                for (var i = 0; i < testPlan.campaigns.length; i++){
                    for (var j = 0; j < testPlan.campaigns[i].scenarii.length; j++){
                        total = total + testPlan.campaigns[i].scenarii[j].executionTime;
                    }
                }
                return total/1000;
            }

            $scope.getTotalOk = function(testPlan){
                var total = 0;
                for (var i = 0; i < testPlan.campaigns.length; i++){
                    total = total + $scope.getCampaignTotalOk(testPlan.campaigns[i]);
                }
                return total;
            }

            $scope.getTotalKo = function(testPlan){
                var total = 0;
                for (var i = 0; i < testPlan.campaigns.length; i++){
                    total = total + $scope.getCampaignTotalKo(testPlan.campaigns[i]);
                }
                return total;
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
                    $scope.report.perfline = ChartUtils.buildPerfLineChart($scope.report);
                    $scope.report.pie = ChartUtils.buildPieChart($scope.report);
                });
            }

            __init__();
        }
    };
});