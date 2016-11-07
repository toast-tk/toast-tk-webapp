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

            $scope.scenarioTypeDropdownLabel = "web";

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
                scenarioCopy.project = $scope.project;
                scenarioCopy.parent = scenarioCopy.parent.toString();
                playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy).then(function (savedScenario) {
                    TreeLayoutService.add(savedScenario.data).then(function(newId){
                        savedScenario.data.id = newId;
                        playRoutes.controllers.ScenarioController.saveScenarii().post(savedScenario.data).then(function (response) {
                            console.log("scenario saved ", savedScenario.data);
                            $uibModalInstance.close(response.data);
                        },function(){
                            toastr.error('Could Not save new node: Error 10 !');
                        });
                    });
                },function(){
                    toastr.error('Could Not save new node: Error 11 !');
                    //TODO; #fix should remove added node here
                });
            };
        }
    };
});