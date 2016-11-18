(function() {
    "use strict";
    angular.module("app").controller("TestPlanCtrl", TestPlanCtrl);

    function TestPlanCtrl($scope, playRoutes,
                                $state,$sideSplit, LayoutService,
                                defaultProject, toastr) {

            $scope.defaultProject = defaultProject;
            $scope.projects = [];
            $scope.selectedProject = undefined;
            $scope.stateParams = $state.params;

            /* begin : adjusting page content size */
            $scope.effectContentWidth = LayoutService.reAdjustContentSize();
            webix.event(window, "resize", function(){LayoutService.reAdjustContentSize()});
            $sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(){LayoutService.reAdjustContentSize()});

            $scope.displayTestPlanSetup = function(project){
                $scope.selectedProject = project;
                $state.go("layout.campaign.setup", {"idTestPlan": project.id});
            };

            $scope.displayReport = function (selectedProject) {
                $state.go("layout.campaign.report", {"idTestPlan": selectedProject.id, "reportName": selectedProject.name});
            };

            $scope.addProjectBlock = function () {
                var newTestPlan = {name: "new_test_plan", campaigns: []};
                newTestPlan.project = $scope.defaultProject;
                newTestPlan.creationDate = new Date();
                playRoutes.controllers.TestPlanController.saveProject().post(newTestPlan).then(function (response) {
                    if(angular.isObject(response.data)){
                        $scope.projects.push(response.data);
                    }
                });
            };

            $scope.deleteTestPlan = function(){
                if($scope.selectedProject){
                    playRoutes.controllers.TestPlanController.detachTestPlanReport($scope.selectedProject.id).delete().then(function (response) {
                        __init__()
                    }, function(){
                        toastr.error("Couldn't not delete selected report !");
                    });
                }
            };

            function __init__() {
                playRoutes.controllers.TestPlanController.loadProject($scope.defaultProject._id).get().then(function (response) {
                    $scope.projects = response.data || [];
                    $scope.selectedProject = undefined;
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

})();