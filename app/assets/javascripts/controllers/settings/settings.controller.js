define(["angular"], function (angular) {
    "use strict";
    return {
        SettingsCtrl: function ($rootScope, $scope, playRoutes, ngProgress, $sideSplit, LayoutService, TreeLayoutService, ICONS) {
            var vm = $scope;
            
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
                    console.log("$scope.configurations", $scope.configurations);
                    angular.forEach($scope.configurations , function(conf){
                        conf.data = conf.rows ;
                        conf.value = conf.name || conf.type ; 
                    });

                    var treeExplorerPromise = TreeLayoutService.build("toastConfigTreeExplorer",
                     $scope.configurations,
                     function(obj, common){
                        if(angular.isDefined(obj.rows) && obj.rows.length > 0){
                            obj.image = ICONS['settings'];
                        }else{
                            obj.image = ICONS['setting'];
                        }                
                        obj.name = obj.name || obj.type ; 
                        return common.icon(obj,common)+ "<i class='"+ obj.image +"' style='float:left; margin:3px 4px 0px 1px;'> </i>" + obj.name;
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