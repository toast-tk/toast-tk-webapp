define(["angular"], function (angular) {
    "use strict";
    return {
        TestPlanCtrl: function ($rootScope, $scope, playRoutes,
                                ngProgress, $window, $timeout,
                                $stateParams,
                                $state,$sideSplit, LayoutService,
                                defaultProject, ChartUtils) {

            $scope.defaultProject = defaultProject
            $scope.projects = [];
            $scope.stateParams = $state.params;

            /* begin : adjusting page content size */
            $scope.effectContentWidth = LayoutService.reAdjustContentSize();
            webix.event(window, "resize", function(){LayoutService.reAdjustContentSize()});
            $sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(){LayoutService.reAdjustContentSize()});

            $scope.displayTestPlanSetup = function(project){
                $scope.selectedProject = project;
                $state.go("layout.campaign.setup", {"idTestPlan": project.id});
            }

            $scope.displayReport = function (selectedProject) {
                $state.go("layout.campaign.report", {"idTestPlan": selectedProject.id, "reportName": selectedProject.name});
            }

            function __init__() {

                playRoutes.controllers.TestPlanController.loadProject($scope.defaultProject._id).get().then(function (response) {
                    var data = response.data || [];
                    $scope.projects = data;
                    if($scope.stateParams.idTestPlan){
                        for(var i=0; i<$scope.projects.length; i++){
                            if($scope.projects[i].id === $scope.stateParams.idTestPlan){
                                $scope.selectedProject = $scope.projects[i];
                                break;
                            }
                        }
                    }
                });
            }

            __init__();
        }
    };
});