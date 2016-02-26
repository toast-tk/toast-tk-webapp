define(["angular"], function (angular) {
    "use strict";
    return {
        newStepModalCtrl: function ($scope,  $modalInstance, ScenarioService) {
            console.log("new node type", $scope.newNodeType);
            var newScenario = {};
            if($scope.newNodeType === "folder"){
                newScenario.type = "folder";
                newScenario.image = "folder";
                newScenario.data = [];
            }

            $scope.scenarioTypeDropdownLabel = "Select type ..";
            
            $scope.closeModal = closeModal ;
            function closeModal(){
             $modalInstance.close();
         }

         $scope.createNewNode = function(){
            newScenario.name = $scope.scenarioName;
            newScenario.value = $scope.scenarioName;
            ScenarioService.addToExplorerTree(newScenario);
            closeModal();
        }

        $scope.swapToType = function(type){
            $scope.scenarioTypeDropdownLabel = type;
            newScenario.type = type;
            if(newScenario.type === "swing"){
                newScenario.image = "laptop";    
            }else if(newScenario.type === "service"){
                newScenario.image = "bolt";    
            } else if(newScenario.type === "web"){
                newScenario.image = "globe";    
            } else {
                newScenario.image = "file-code-o";    
            }
        }
    }
};
});