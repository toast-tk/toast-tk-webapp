(function() {
    "use strict";
    angular.module("app").controller("newStepModalCtrl", newStepModalCtrl);

    function  newStepModalCtrl($scope,  $uibModalInstance, ICONS, playRoutes, toastr) {
            $scope.ICONS = ICONS;
            var newNode = {};

            if($scope.newNodeType === "folder"){
                $scope.scenarioType = "folder";
                newNode.image = ICONS["folder"];
                newNode.data = [];
            } else {
                $scope.scenarioType = "web";
            }

            $scope.closeModal = closeModal ;
            function closeModal(){
                $uibModalInstance.dismiss();
            }

            $scope.createNewNode = function(){

                playRoutes.controllers.ScenarioController.loadScenarioCtx(newNode.type).get().then(function (response) {

                    var scenarioCtxDescriptor = response.data;
                    newNode.name = $scope.scenarioName;
                    newNode.value = $scope.scenarioName;
                    newNode.type =  $scope.scenarioType;
                    newNode.driver =  newNode.type;
                    newNode.columns = scenarioCtxDescriptor;
                    newNode.rows = [];
                    newNode.parent = $scope.newNodeparent || "0" ;
                    save(newNode);
                });
            };

            function save(scenario) {
                var scenarioCopy = angular.copy(scenario);
                scenarioCopy.rows = JSON.stringify(scenarioCopy.rows);
                delete scenarioCopy.columns;
                scenarioCopy.project = $scope.project;
                scenarioCopy.parent = scenarioCopy.parent.toString();
                playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy).then(function (savedScenario) {
                        savedScenario.data.id = Math.floor(Math.random() * 10000000) + 1000000000;
                        playRoutes.controllers.ScenarioController.saveScenarii().post(savedScenario.data).then(function (response) {
                            console.log("scenario saved ", savedScenario.data);
                            $uibModalInstance.close(response.data);
                        },function(){
                            toastr.error("Could Not save new node: Error 10 !");
                        });

                },function(){
                    toastr.error("Could Not save new node: Error 11 !");
                    //TODO; #fix should remove added node here
                });
            }
        }

})();