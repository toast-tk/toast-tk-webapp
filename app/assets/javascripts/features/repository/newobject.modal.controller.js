define(["angular"], function (angular) {
    "use strict";
    return {
        newObjectModalCtrl: function ($scope,  $uibModalInstance, ICONS) {
            $scope.ICONS = ICONS;
            var newObject = {};
            $scope.scenarioTypeDropdownLabel = "Select type ..";
            
            $scope.closeModal = function(){
             $uibModalInstance.dismiss();
         }

         $scope.createNewObject = function(){
            newObject.name = $scope.newObjectName;
            $uibModalInstance.close(newObject);
        }

        $scope.swapToType = function(type){
            $scope.scenarioTypeDropdownLabel = type;
            newObject.type = type;
            newObject.image = ICONS[type]; 
        }
    }
};
});