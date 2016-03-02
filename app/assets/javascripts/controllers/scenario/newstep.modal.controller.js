define(["angular"], function (angular) {
    "use strict";
    return {
        newStepModalCtrl: function ($scope,  $modalInstance, TreeLayoutService,ICONS) {
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
            newScenario.name = $scope.scenarioName;
            newScenario.value = $scope.scenarioName;
            TreeLayoutService.add(newScenario);
            $modalInstance.close(newScenario.type);
        }

        $scope.swapToType = function(type){
            $scope.scenarioTypeDropdownLabel = type;
            newScenario.type = type;
            newScenario.image = ICONS[type]; 
/*            else {
                newScenario.image = "file-code-o";    
            }*/
        }
    }
};
});