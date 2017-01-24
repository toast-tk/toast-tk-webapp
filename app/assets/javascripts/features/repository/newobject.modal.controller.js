(function() {
    "use strict";
    angular.module("app").controller("newObjectModalCtrl", newObjectModalCtrl);

    function newObjectModalCtrl($scope,  $uibModalInstance, ICONS) {
            $scope.ICONS = ICONS;

            $scope.repositoryType="web page";
            $scope.closeModal = function(){
                $uibModalInstance.dismiss();
            };

            $scope.createNewObject = function(){
                $uibModalInstance.close({
                    name : $scope.newObjectName,
                    type :  $scope.repositoryType,
                    image : ICONS[$scope.repositoryType]
                });
            };

        }
})();