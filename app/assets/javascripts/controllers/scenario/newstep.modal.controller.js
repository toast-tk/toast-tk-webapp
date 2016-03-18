define(["angular"], function (angular) {
    "use strict";
    return {
        newStepModalCtrl: function ($scope,  $modalInstance, TreeLayoutService,ICONS, playRoutes) {
            $scope.ICONS = ICONS;
             var newScenario = {};

            if($scope.newNodeType === "folder"){
                newScenario.type = "folder";
                newScenario.image = ICONS["folder"];
                newScenario.data = [];
            }

            $scope.scenarioTypeDropdownLabel = "Select type ..";
            
            $scope.closeModal = closeModal ;
            function closeModal(){
             $modalInstance.dismiss();
         }

         $scope.createNewNode = function(){

            playRoutes.controllers.ScenarioController.loadScenarioCtx(newScenario.type).get().then(function (response) {

                var scenarioCtxDescriptor = response.data;
                newScenario.name = $scope.scenarioName;
                newScenario.value = $scope.scenarioName;
                newScenario.driver =  newScenario.type;
                newScenario.columns = scenarioCtxDescriptor;
                newScenario.parent = newScenario.$parent ;
                newScenario.rows = [];
                console.log("scenario:", newScenario);
                TreeLayoutService.add(newScenario);
                    save(newScenario);
                        
                });
        }

        $scope.swapToType = function(type){
            $scope.scenarioTypeDropdownLabel = type;
            newScenario.type = type;
        }

        /**/
        function save(scenario) {
                var scenarioCopy = angular.copy(scenario);
                scenarioCopy.rows = JSON.stringify(scenarioCopy.rows);
                delete scenarioCopy.columns;
                delete scenarioCopy.id;
                playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy).then(function () {
                    $modalInstance.close(newScenario);
                });
            };
    }
};
});