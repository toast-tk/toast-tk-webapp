define(["angular"], function (angular) {
    "use strict";
    return {
        SettingsCtrl: function ($rootScope, $scope, playRoutes, ngProgress) {
            var vm = $scope;
            $scope.service_config_types = ["web", "swing", "service"];
            $scope.selectedConfig = undefined;
            $scope.configurations = [];

            $scope.addNewSentence = addNewSentence;
            $scope.deleteSentenceLine = deleteSentenceLine;
            $scope.saveConfig = saveConfig;
            $scope.addConfigBlock = addConfigBlock;
            $scope.editConfigLine = editConfigLine;
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

            function editConfigLine(config, item) {
                $scope.selectedConfig = config;
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
                });
            }

        }
    };
});