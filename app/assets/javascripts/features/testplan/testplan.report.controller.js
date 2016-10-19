define(["angular"], function (angular) {
    "use strict";
    return {
        TestPlanReportCtrl: function ($rootScope, $scope, playRoutes,
                                ngProgress, $window, $timeout, $stateParams,
                                $state, $sideSplit, LayoutService,
                                defaultProject, ChartUtils, report) {

            $scope.defaultProject = defaultProject
            $scope.view_tab = 'tab1';
            $scope.report = report;
            $scope.report.line = ChartUtils.buildLineChart($scope.report);
            $scope.report.perfline = ChartUtils.buildPerfLineChart($scope.report);
            $scope.report.pie = ChartUtils.buildPieChart($scope.report);

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

            $scope.displayTestReport = function (testName) {
                var params = {
                    "idTestPlan": $stateParams.idTestPlan, 
                    "reportName": $scope.report.testPlan.name,
                    "iteration": $scope.report.testPlan.iterations.toString(),
                    "testName": testName
                }
                $state.go("layout.campaign.test", params);
            }
        },
        TestPageReportCtrl:function ($rootScope, $scope, playRoutes,
                                     ngProgress, $window, $timeout, $stateParams,
                                     defaultProject, ChartUtils, report, Lightbox) {
            $scope.testPlan = report.testPlan;
            function __init__() {
                playRoutes.controllers.TestPlanController.loadTestReport($stateParams.reportName, $stateParams.iteration,
                    $stateParams.testName).get().then(function (response) {
                    $scope.report = response.data || {};
                });
            }
            $scope.displayImage = function(line){
                Lightbox.openModal([{
                    'url': "data:image/png;base64," + line.screenshot,
                    'caption': "Screenshot for step: " + line.test
                }], 0);
            }
            __init__();
        }

    };
});