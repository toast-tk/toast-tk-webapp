define(["angular"], function (angular) {
    "use strict";
    return {
        RepositoryCtrl: function ($rootScope, $scope, playRoutes, ngProgress) {
            $scope.run_config_types = [ "swing page", "web page", "service entity"];
            $scope.autosetups = [];
            $scope.newAutoSetupRow = {};
            $scope.selectedAutoSetupConfigType = "";
            $scope.autoSetupConfigFilter = $scope.run_config_types[0];
            $scope.autosetups = [];
            $scope.autosetup = undefined;

            $scope.editRepositoryObject = editRepositoryObject;

            $scope.$watch("autoSetupConfigFilter", function(oldValue, newValue){
                load();
            });

            $scope.addAutoSetupConfig = function () {
                playRoutes.controllers.Application.loadAutoSetupCtx($scope.selectedAutoSetupConfigType).get().then(function (response) {
                    var autoSetupDescriptor = response.data;
                    var newSetupBlock = {
                        type: $scope.selectedAutoSetupConfigType,
                        columns: autoSetupDescriptor,
                        rows: []
                    };
                    $scope.autosetups.push();
                    $scope.autosetup = newSetupBlock;
                });
            };

            $scope.isArray = function (arr) {
                return angular.isArray(arr) ? "array" : "";
            }

            function editRepositoryObject(autosetup){
                $scope.autosetup = autosetup;
            } 

            /*
                $scope.saveAutoConfig = function () {
                    var deepCopy = angular.copy($scope.autosetups);
                    deepCopy = deepCopy.map(function (autoSetup) {
                        delete autoSetup.columns;
                        return autoSetup;
                    });
                    playRoutes.controllers.Application.saveAutoConfig().post(deepCopy).then(function (response) {
                        load();
                    });
                };
            */

            $scope.saveAutoConfigBlock = function (autosetup) {
                var deepCopy = angular.copy(autosetup);
                delete deepCopy.columns;
                if(deepCopy.type === "service entity"){
                    playRoutes.controllers.RepositoryController.saveServiceConfigBlock().post(deepCopy).then(function (response) {
                        load();
                    });
                    
                }else{
                    playRoutes.controllers.RepositoryController.saveAutoConfigBlock().post(deepCopy).then(function (response) {
                        load();
                    });
                }
            };

            $scope.deleteRow = function (row, autosetup) {
                autosetup.rows.splice(autosetup.rows.indexOf(row), 1);
            }

            $scope.addAutoSetupRow = function (autosetup, newRow) {
                autosetup.rows.push(newRow);
                $scope.newAutoSetupRow = {};
            };

            function load() {
                if(angular.isDefined($scope.autoSetupConfigFilter) && $scope.autoSetupConfigFilter != ""){
                    if($scope.autoSetupConfigFilter == "swing page"){
                        playRoutes.controllers.RepositoryController.loadAutoConfiguration().get().then(handleResult);
                    }else if ($scope.autoSetupConfigFilter == "web page"){
                        playRoutes.controllers.RepositoryController.loadWebPageRepository().get().then(handleResult);
                    }else if ($scope.autoSetupConfigFilter == "service entity"){
                        playRoutes.controllers.RepositoryController.loadServiceEntityRepository().get().then(handleResult);
                    }
                }

                function handleResult(response){
                    var autosetups = response.data.map(function (obj) {
                        obj.rows = angular.isObject(obj.rows) ? obj.rows : JSON.parse(obj.rows);
                        return obj;
                    });
                    $scope.autosetups = autosetups || [];
                }
            }


            load();
        }
    };
});