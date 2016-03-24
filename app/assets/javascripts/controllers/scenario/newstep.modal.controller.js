define(["angular"], function (angular) {
    "use strict";
    return {
        newStepModalCtrl: function ($scope,  $modalInstance, TreeLayoutService,ICONS, playRoutes, toastr) {
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
             $modalInstance.dismiss();
         }

         $scope.createNewNode = function(){

            playRoutes.controllers.ScenarioController.loadScenarioCtx(newNode.type).get().then(function (response) {

                var scenarioCtxDescriptor = response.data;
                newNode.name = $scope.scenarioName;
                newNode.value = $scope.scenarioName;
                newNode.driver =  newNode.type;
                newNode.columns = scenarioCtxDescriptor;
                newNode.rows = [];
                TreeLayoutService.add(newNode).then(function(newId){
                    newNode.parent = newNode.$parent || "0" ;
                    save(newNode);

                });
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
                playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy).then(function () {
                    $modalInstance.close(scenario);
                },function(){
                    toastr.error('Could Not save new node !');
                    //TODO; #fix should remove added node here
                });
            };
    }
};
});