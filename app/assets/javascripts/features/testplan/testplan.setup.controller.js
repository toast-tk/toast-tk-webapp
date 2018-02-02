(function() {
    "use strict";

    angular.module("app").controller("TestPlanSetupCtrl", TestPlanSetupCtrl);

    function TestPlanSetupCtrl($scope, playRoutes, $stateParams,
                                defaultProject, $state) {

            $scope.defaultProject = defaultProject;
            $scope.selectedProject = undefined;
            $scope.scenarii = [];

            $scope.isNotSaved = function (project) {
                return !angular.isDefined(project.id);
            };

            $scope.addCampaignToProject = function (project) {
                project.campaigns.push({name: "New Campaign", scenarii: []});
            };

            $scope.addScenarioToCampaign = function (campaign) {
                campaign.scenarii.push({});
            };

            $scope.deleteCampaign = function (campaign, project) {
                project.campaigns.splice(project.campaigns.indexOf(campaign), 1);
            };

            $scope.deleteScenario = function (scenario, campaign) {
                campaign.scenarii.splice(campaign.scenarii.indexOf(scenario), 1);
            };

            $scope.saveProject = function (testPlan) {
                var testPlanToSave = testPlan;
                testPlanToSave.project = $scope.defaultProject;
                playRoutes.controllers.TestPlanController.saveProject().post(testPlanToSave).then(function (response) {
                    $state.reload();
                    __init__();  
                });
            };

            $scope.showDetails = function (scenario) {
                alert("TODO: Implement details display !")
            };

            $scope.disableProject = function (project) {
                alert("TODO: Implement disabling projects !")
            };

            $scope.knowScenario = function(name){
                if(name === undefined) return true;
                var result = $.grep($scope.scenarii, function(e){ return e.name == name; });
                return result.length > 0;
            };

            function __init__() {
                playRoutes.controllers.ScenarioController.loadScenarii($scope.defaultProject._id).get().then(function (response) {
                    var data = response.data || [];
                    $scope.scenarii = data;
                });

                playRoutes.controllers.TestPlanController.loadTestPlanSetup($stateParams.idTestPlan).get().then(function (response) {
                    var data = response.data || [];
                    $scope.selectedProject = data;
                });


            }

            __init__();
        }
})();
