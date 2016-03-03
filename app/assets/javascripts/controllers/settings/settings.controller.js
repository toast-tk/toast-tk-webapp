define(["angular"], function (angular) {
    "use strict";
    return {
        SettingsCtrl: function ($rootScope, $scope, playRoutes, ngProgress, $sideSplit, LayoutService, TreeLayoutService, $modal, ICONS) {
            var vm = $scope;
            $scope.ICONS = ICONS;
            
            $scope.effectContentWidth = LayoutService.reAdjustContentSize();
            webix.event(window, "resize", function(){LayoutService.reAdjustContentSize()});
            $sideSplit.addCollapseCallBack(
                angular.element('#sidebarmenu'), 
                function(){LayoutService.reAdjustContentSize()});


            $scope.service_config_types = ["web", "swing", "service"];
            $scope.selectedConfig = undefined;
            $scope.configurations = [];

            $scope.addNewSentence = addNewSentence;
            $scope.deleteSentenceLine = deleteSentenceLine;
            $scope.saveConfig = saveConfig;
            $scope.addConfigBlock = addConfigBlock;
            $scope.deleteConfigLine = deleteConfigLine;
            $scope.addConfigLine = addConfigLine;

            __init__();


            function addNewSentence(newSentence, sentenceWithTypes) {
                $scope.selectedConfig.syntax.push({sentence: newSentence, typed_sentence: sentenceWithTypes});
            };

            function deleteSentenceLine(newSentence) {
                $scope.selectedConfig.syntax.splice($scope.selectedConfig.syntax.indexOf(newSentence), 1);
            };

            function saveConfig() {
                playRoutes.controllers.ConfigurationController.saveConfiguration().post($scope.configurations).then(function (response) {
                    load();
                });
            };

            function addConfigBlock() {
                $scope.configurations.push({type: "service", rows: []});
            };

            function deleteConfigLine(config, item) {
                config.rows.splice(config.rows.indexOf(item), 1);
            };

            function addConfigLine(config, configName, configType) {
                config.rows.push({type: configType, name: configName, syntax: []});
            };

            function __init__() {
                playRoutes.controllers.ConfigurationController.loadConfiguration().get().then(function (response) {
                    $scope.configurations = response.data || [];
                    angular.forEach($scope.configurations , function(conf){
                        conf.data = conf.rows ;
                        conf.value = conf.name || conf.type ; 
                    });

                    var treeExplorerPromise = TreeLayoutService.build("toastConfigTreeExplorer",
                     $scope.configurations,
                     function(obj, common){
                        if(!angular.isDefined(obj.image) || obj.image == null){
                           if(angular.isDefined(obj.rows)){
                                obj.image = ICONS['settings set'];
                            }else{
                               obj.image = ICONS['settings'];
                            }             
                        }
                        obj.name = obj.name || obj.type ; 
                        return common.icon(obj,common)+ "<i class='"+ obj.image +"' style='float:left; margin:3px 4px 0px 1px;'> </i>" + obj.name;
                    });

                    treeExplorerPromise.then(function(treeExplorer){
                        TreeLayoutService.adjustTreeSize(treeExplorer);
                        $scope.addNodeToParent = function(nodeType){
                            TreeLayoutService.saveConcernedNode(treeExplorer).then(function(){
                                var modalScope = $scope.$new(true);
                                modalScope.newNodeType = nodeType;
                                var modalInstance = $modal.open({
                                    animation: $scope.animationsEnabled,
                                    templateUrl: 'assets/html/settings/newSettings.modal.html',
                                    controller:'NewSettingsModalCtrl',
                                    scope : modalScope
                                });

                                modalInstance.result.then(function(selectedType){
                                    if(selectedType.type === "settings set"){
                                        $scope.configurations.push({type: selectedType.name, rows: []});    
                                    } else if(selectedType.type != "settings set"){
                                      /*  config.rows.push({type: selectedType.type, name: selectedType.name, syntax: []});*/
                                    }
                                });
                            });    
                        }
                    });

                    TreeLayoutService.addSelectedNodeCallback("toastConfigTreeExplorer", function(selectedConfig){
                         $scope.selectedConfig = selectedConfig;
                         $scope.$apply();
                    }, function(selectedElementId,selectedItem){
                        return angular.isDefined(selectedItem.syntax);
                    });
                });
            }

        }
    };
});