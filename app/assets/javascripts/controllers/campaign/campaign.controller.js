define(["angular"], function (angular) {
    "use strict";
    return {
        CampaignCtrl: function ($rootScope, $scope, playRoutes, ngProgress, $window, $timeout, $sideSplit, LayoutService) {
            $scope.projects = [];


            /* begin : adjusting page content size */
            $scope.effectContentWidth = LayoutService.reAdjustContentSize();
            webix.event(window, "resize", function(){LayoutService.reAdjustContentSize()});
            $sideSplit.addCollapseCallBack(
                angular.element('#sidebarmenu'), 
                function(){LayoutService.reAdjustContentSize()});


            $scope.selectProject = function(project){
                $scope.selectedProject = project;
            }

            playRoutes.controllers.ScenarioController.loadScenarii().get().then(function (response) {
                var data = response.data || [];
                $scope.scenarii = data;
            });

            $scope.isNotSaved = function (project) {
                return !angular.isDefined(project.id);
            }

            $scope.addProjectBlock = function () {
                $scope.projects.push({name: "project", campaigns: []});
            }

            $scope.addCampaignToProject = function (project) {
                project.campaigns.push({name: "new campaign", scenarii: []});
            }

            $scope.addScenarioToCampaign = function (campaign) {
                campaign.scenarii.push({});
            }

            $scope.deleteCampaign = function (campaign, project) {
                project.campaigns.splice(project.campaigns.indexOf(campaign), 1);
            }

            $scope.deleteScenario = function (scenario, campaign) {
                campaign.scenarii.splice(campaign.scenarii.indexOf(scenario), 1);
            }

            $scope.saveProject = function (project) {
                playRoutes.controllers.ProjectController.saveProject().post(project).then(function (response) {
                    load();
                });
            }

            $scope.showDetails = function (scenario) {
                alert("TODO: Implement details display !")
            }

            $scope.disableProject = function (project) {
                alert("TODO: Implement disabling projects !")
            }

            $scope.displayReport = function (project) {
                var project = {};
                project.name = "rus.3.7.campaign.script" ;
                $window.open("/loadProjectReport/" + project.name)
/*                playRoutes.controllers.ProjectController.loadProjectReport(project.name).get().then(function (response) {
                    console.log(response)
                });*/
            }

            function load() {
                playRoutes.controllers.ProjectController.loadProject().get().then(function (response) {
                    var data = response.data || [];
                    $scope.projects = data;
                });
            }

            load();
        }
    };
});