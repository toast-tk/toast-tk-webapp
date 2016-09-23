define(["angular"], function (angular) {
    "use strict";
    return {
        RepositoryCtrl: function ($rootScope, $scope, playRoutes,
                                  ngProgress, $timeout, $uibModal,
                                  $sideSplit, LayoutService, toastr, ICONS,
                                  defaultProject) {
            $scope.defaultProject = defaultProject;
            $scope.run_config_types = [ "swing page", "web page"];
            $scope.autosetups = [];
            $scope.newAutoSetupRow = {};
            $scope.selectedAutoSetupConfigType = "";
            $scope.autoSetupConfigFilter = $scope.run_config_types[1];
            $scope.autosetups = [];
            $scope.autosetup = undefined;

            $scope.ICONS = ICONS;
            $scope.editRepositoryObject = editRepositoryObject;

            $scope.$watch("autoSetupConfigFilter", function(oldValue, newValue){
                __init__();
            });

            /* begin : adjusting page content size */
            $scope.effectContentWidth = LayoutService.reAdjustContentSize();
            webix.event(window, "resize", function(){LayoutService.reAdjustContentSize()});
            $sideSplit.addCollapseCallBack(
                angular.element('#sidebarmenu'), 
                function(){LayoutService.reAdjustContentSize()});


            /* BEGIN : open & add object modal */
            $scope.addNewObject = function(){
                var modalScope = $scope.$new(true);
                    var modalInstance = $uibModal.open({
                        animation: $scope.animationsEnabled,
                        templateUrl: 'assets/html/repository/newobject.modal.repository.html',
                        controller:'newObjectModalCtrl'
                    });

                    modalInstance.result.then(function(newObject){
                        addAutoSetupConfig(newObject);
                        toastr.success('Object List created !');
                    });   
            }
            
            function addAutoSetupConfig(newObject) {
                playRoutes.controllers.Application.loadAutoSetupCtx(newObject.type).get().then(function (response) {
                    var autoSetupDescriptor = response.data;
                    var newSetupBlock = {
                        name: newObject.name,
                        type: newObject.type,
                        columns: autoSetupDescriptor,
                        rows: []
                    };
                    $scope.autosetups.push(newSetupBlock);
                    $scope.autosetup = newSetupBlock;
                });
            };
             /* END : open & add object modal */

            $scope.isArray = function (arr) {
                return angular.isArray(arr) ? "array" : "";
            }

            function editRepositoryObject(autosetup){
                $scope.autosetup = autosetup;
            } 


           $scope.deleteObject = function(autosetup){
                playRoutes.controllers.RepositoryController.deleteObject().post(angular.toJson(autosetup.id)).then(function () {
                    __init__();
                });
           }

            $scope.saveAutoConfigBlock = function (autosetup) {
                var deepCopy = angular.copy(autosetup);
                delete deepCopy.columns;
                deepCopy.project = $scope.defaultProject;
                playRoutes.controllers.RepositoryController.saveAutoConfigBlock().post(deepCopy).then(function (response) {
                     __init__();
                     toastr.success('Saved Objet repository elements !');
                });
            };

            $scope.deleteRow = function (row, autosetup) {
                autosetup.rows.splice(autosetup.rows.indexOf(row), 1);
            }

            $scope.addAutoSetupRow = function (autosetup, newRow) {
                autosetup.rows.push(newRow);
                $scope.newAutoSetupRow = {};
            };

            function __init__() {
                if(angular.isDefined($scope.autoSetupConfigFilter) && $scope.autoSetupConfigFilter != ""){
                    if($scope.autoSetupConfigFilter == "swing page"){
                        playRoutes.controllers.RepositoryController.loadAutoConfiguration($scope.defaultProject._id).get().then(handleResult);
                    }else if ($scope.autoSetupConfigFilter == "web page"){
                        playRoutes.controllers.RepositoryController.loadWebPageRepository($scope.defaultProject._id).get().then(handleResult);
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

            __init__();
        }
    };
});