define(["angular"], function (angular) {
    "use strict";
    return {
        NewSettingsModalCtrl: function ($scope,  $modalInstance, TreeLayoutService,ICONS, $timeout) {
            $scope.ICONS = ICONS;
            var newScenario = {};
            if($scope.newNodeType === "settings set"){
                newScenario.type = "settings set";
                newScenario.rows = [];
            }

            $scope.scenarioTypeDropdownLabel = "Select type ..";
            
            $scope.closeModal = closeModal ;
            function closeModal(){
             $modalInstance.dismiss();
         }

         $scope.createNewNode = function(){
            newScenario.name = $scope.scenarioName;
            newScenario.value = $scope.scenarioName;
            console.log($.extend({}, newScenario));          
            TreeLayoutService.add(newScenario);
            $modalInstance.close(newScenario);
        }

        $scope.swapToType = function(type){
            $scope.scenarioTypeDropdownLabel = type;
            newScenario.type = type;
            newScenario.image = ICONS[type]; 
        }
    }
};
});