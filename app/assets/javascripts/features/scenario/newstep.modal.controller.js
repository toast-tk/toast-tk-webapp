define(["angular"], function (angular) {
    "use strict";
    return {
        newStepModalCtrl: function ($scope,  $uibModalInstance, TreeLayoutService,ICONS, playRoutes, toastr) {
            $scope.ICONS = ICONS;
            var newNode = {};

            if($scope.newNodeType === "folder"){
                newNode.type = "folder";
                newNode.image = ICONS["folder"];
                newNode.data = [];
            }

            $scope.scenarioTypeDropdownLabel = "Select type ..";

            $scope.closeModal = closeModal ;
            function closeModal(){
                $uibModalInstance.dismiss();
            }

            $scope.createNewNode = function(){

                playRoutes.controllers.ScenarioController.loadScenarioCtx(newNode.type).get().then(function (response) {

                    var scenarioCtxDescriptor = response.data;
                    newNode.name = $scope.scenarioName;
                    newNode.value = $scope.scenarioName;
                    newNode.driver =  newNode.type;
                    newNode.columns = scenarioCtxDescriptor;
                    newNode.rows = [];
                    newNode.parent = TreeLayoutService.getConcernedNode() || "0" ;
                    save(newNode);
                });
            }

            $scope.swapToType = function(type){
                $scope.scenarioTypeDropdownLabel = type;
                newNode.type = type;
            }

            /**/
            function save(scenario) {
                var scenarioCopy = angular.copy(scenario);
                scenarioCopy.rows = JSON.stringify(scenarioCopy.rows);
                delete scenarioCopy.columns;
                delete scenarioCopy.id;
                delete scenarioCopy._id;
                scenarioCopy.project = $scope.project;
                playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy).then(function (savedScenario) {
                    TreeLayoutService.add(savedScenario.data).then(function(newId){
                        console.log("saved scenario", savedScenario.data);
                        $uibModalInstance.close(savedScenario.data);
                    });
                },function(){
                    toastr.error('Could Not save new node !');
                    //TODO; #fix should remove added node here
                });
            };
        }
    };
});