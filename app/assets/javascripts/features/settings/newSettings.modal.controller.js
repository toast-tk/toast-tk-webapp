(function() {
    "use strict";

    angular.module("app").controller("NewSettingsModalCtrl", NewSettingsModalCtrl);

    function NewSettingsModalCtrl($scope,  $uibModalInstance, TreeLayoutService,ICONS) {
            $scope.ICONS = ICONS;
            var newScenario = {};
            if($scope.newNodeType === "settings set"){
                newScenario.type = "settings set";
                newScenario.rows = [];
            }

            $scope.scenarioTypeDropdownLabel = "Select type ..";
            
            $scope.closeModal = closeModal ;
            function closeModal(){
             $uibModalInstance.dismiss();
         }

         $scope.createNewNode = function(){
            newScenario.name = $scope.scenarioName;
            newScenario.value = $scope.scenarioName;
            console.log($.extend({}, newScenario));          
            TreeLayoutService.add(newScenario);
            $uibModalInstance.close(newScenario);
        };

        $scope.swapToType = function(type){
            $scope.scenarioTypeDropdownLabel = type;
            newScenario.type = type;
            newScenario.image = ICONS[type]; 
        }
    }

})();