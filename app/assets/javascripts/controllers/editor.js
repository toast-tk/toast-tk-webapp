define(["angular"], function (angular) {
    "use strict";
    return {
        ConfigurationCtrl: function ($rootScope, $scope, playRoutes, ngProgress) {
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
                playRoutes.controllers.Application.saveConfiguration().post($scope.configurations).then(function (response) {
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
                playRoutes.controllers.Application.loadConfiguration().get().then(function (response) {
                    $scope.configurations = response.data || [];
                });
            }

        },
        RepositoryCtrl: function ($rootScope, $scope, playRoutes, ngProgress) {
            $scope.run_config_types = ["web page", "service entity", "swing page"];
            $scope.autosetups = [];
            $scope.newAutoSetupRow = {};
            $scope.selectedAutoSetupConfigType = "";
            $scope.autoSetupConfigFilter = "";
            $scope.autosetups = [];
            $scope.autosetup = undefined;

            $scope.editRepositoryObject = editRepositoryObject;

            $scope.addAutoSetupConfig = function () {
                playRoutes.controllers.Application.loadAutoSetupCtx($scope.selectedAutoSetupConfigType).get().then(function (response) {
                    var autoSetupDescriptor = response.data;
                    $scope.autosetups.push({
                        type: $scope.selectedAutoSetupConfigType,
                        columns: autoSetupDescriptor,
                        rows: []
                    });
                });
            };

            $scope.isArray = function (arr) {
                return angular.isArray(arr) ? "array" : "";
            }

            function editRepositoryObject(autosetup){
                $scope.autosetup = autosetup;
            } 

            /*$scope.saveAutoConfig = function () {
                var deepCopy = angular.copy($scope.autosetups);
                deepCopy = deepCopy.map(function (autoSetup) {
                    delete autoSetup.columns;
                    return autoSetup;
                });
                playRoutes.controllers.Application.saveAutoConfig().post(deepCopy).then(function (response) {
                    load();
                });
            };*/

            $scope.saveAutoConfigBlock = function (autosetup) {
                var deepCopy = angular.copy(autosetup);
                delete deepCopy.columns;
                playRoutes.controllers.Application.saveAutoConfigBlock().post(deepCopy).then(function (response) {
                    load();
                });
            };

            $scope.deleteRow = function (row, autosetup) {
                autosetup.rows.splice(autosetup.rows.indexOf(row), 1);
            }

            $scope.addAutoSetupRow = function (autosetup, newRow) {
                autosetup.rows.push(newRow);
                $scope.newAutoSetupRow = {};
            };

            function load() {
                playRoutes.controllers.Application.loadAutoConfiguration().get().then(function (response) {
                    //convert autosetup rows into json
                    var autosetups = response.data.map(function (obj) {
                        obj.rows = angular.isObject(obj.rows) ? obj.rows : JSON.parse(obj.rows);
                        return obj;
                    });
                    $scope.autosetups = autosetups || [];
                });
            }

            load();
        },
        ScenarioCtrl: function ($rootScope, $scope, playRoutes, ngProgress) {
            
            $scope.newRow = {};
            $scope.scenario_types = [];
            $scope.selectedType = "";
            $scope.importModes = ["prepend", "append"];
            $scope.scenarii = [];
            $scope.regexList = [];
            $scope.regexMap = [];
            $scope.scenario = undefined;
            $scope.stepType = "";

            $scope.add = add;
            $scope.addRow = addRow;
            $scope.save = save;
            $scope.deleteRow = deleteRow;
            $scope.importScenario = importScenario;
            $scope.onPatternValueChange = onPatternValueChange;
            $scope.convertToTemplate = convertToTemplate;
            $scope.editScenario = editScenario;
            $scope.deleteScenarii = deleteScenarii;
            $scope.swaptToSwingRow = swaptToSwingRow;
            $scope.swaptToWebRow = swaptToWebRow;
            $scope.swaptToServiceRow = swaptToServiceRow;

            $scope.$watch("scenario_types", watch_scenario_types, true);

            __init__();

            function watch_scenario_types(oldVal, newVale){
                if(angular.isDefined($scope.scenario_types) && angular.isArray( $scope.scenario_types)){
                    for(var i =0 ; i < $scope.scenario_types.length; i++){
                        var scenariiDef = $scope.scenario_types[i];
                        playRoutes.controllers.Application.loadCtxSentences(scenariiDef.type).get().then(function(response){
                            if(!angular.isDefined($scope.regexList)){
                                $scope.regexList = response.data || [];
                                $scope.regexMap[scenariiDef.type] = $scope.regexList;
                            }else{
                                $scope.regexList = $scope.regexList.concat(response.data || []);
                                $scope.regexMap[scenariiDef.type] = $scope.regexList;
                            }
                        });
                    }   
                }
            }

            function editScenario(scenario){
                $scope.scenario = scenario; 
                swaptToDefaultRow();
            }

            ////////// trigger the right event !! //////////////
            function swaptToSwingRow(){
                $scope.stepType = "swing";
                $scope.regexList = $scope.regexMap[$scope.stepType];
            }

            function swaptToServiceRow(){
                $scope.stepType = "service";
                $scope.regexList = $scope.regexMap[$scope.stepType];
            }

            function swaptToWebRow(){
                $scope.stepType = "web";
                $scope.regexList = $scope.regexMap[$scope.stepType];
            }

            function swaptToDefaultRow(){
                $scope.stepType = $scope.scenario.type;   
                $scope.regexList = $scope.regexMap[$scope.stepType];
            }
            //////////////////////////////////////////////////

            function add() {
                playRoutes.controllers.Application.loadScenarioCtx($scope.selectedType.type).get().then(function (response) {
                    var scenarioDescriptor = response.data;
                    $scope.scenarii.push({
                        type: $scope.selectedType.type,
                        driver: $scope.selectedType.name, //related service
                        columns: scenarioDescriptor,
                        rows: []
                    });
                });
            };

            function addRow(newRow) {
                newRow.kind = $scope.stepType;
                $scope.scenario.rows.push(newRow);
                $scope.newRow = {};
            };

            function deleteRow(scenario, row) {
                //ajax call directly, if not new !
                scenario.rows.splice(scenario.rows.indexOf(row), 1);
            };

            function save() {
                var scenarioCopy = angular.copy($scope.scenario);
                scenarioCopy.rows = JSON.stringify(scenarioCopy.rows);
                delete copy.columns;
                playRoutes.controllers.Application.saveScenarii().post(scenarioCopy).then(function () {
                    __init__();
                });
            };

            function deleteScenarii(scenario){
                playRoutes.controllers.Application.deleteScenarii().post(angular.toJson(scenario.id)).then(function () {
                    __init__();
                });
            }

            function importScenario(scenario) {
                var mode = scenario.selectedImportMode;
                var toImport = scenario.imp;
                if (mode == "prepend") {
                    scenario.rows = angular.copy(toImport.rows).concat(scenario.rows);
                } else if (mode == "append") {
                    scenario.rows = scenario.rows.concat(angular.copy(toImport.rows));
                }
                delete scenario.imp;
                delete scenario.selectedImportMode;
            };

            function onPatternValueChange(row, position, identifier, value) {
                var newVal = {id: identifier, pos: position, val: value};
                if (angular.isUndefined(row.mappings)) {
                    row.mappings = [];
                    row.mappings.push(newVal);
                } else {
                    var found = false;
                    for (var i = 0; i < row.mappings.length; i++) {
                        if (row.mappings[i].pos == position) {
                            row.mappings[i] = newVal;
                            found = true;
                        }
                    }
                    if (!found) {
                        row.mappings.push(newVal)
                    }
                }
            }

            function convertToTemplate(scenario){
                var newScenarioTemplate = angular.copy(scenario);
                newScenarioTemplate.name = newScenarioTemplate.name + "_template"
                var regexList = $scope.regexList;

                for(var i = 0 ; i < newScenarioTemplate.rows.length ; i++){
                    var sentence = newScenarioTemplate.rows[i].patterns;
                    for(var j=0; j < regexList.length; j++){
                        var modifiedRegex = regexList[j].typed_sentence.replace(/\\\\+/g, '\\');
                        var checkSentence = sentence.replace(/\*/g, "");
                        var regex = new RegExp(modifiedRegex, 'i');
                        var pattern = regexList[j].sentence;
                        if(regex.test(checkSentence)){
                            newScenarioTemplate.rows[i].patterns = pattern;

                            /** ---------------- **/
                            var patternValue = pattern;
                            var tag = "";
                            var tags = [];
                            var tagPosition = 0;
                            while (tag != null) {
                                if(tag != ""){
                                    tags.push(tag);
                                    var tagName = tags[tagPosition][0];
                                    var varType = tags[tagPosition][3];
                                    var varDescriptor = tags[tagPosition][4];
                                    //warning (variable ($name) split)
                                    var replacementValue = checkSentence.split(" ")[getIndex(pattern.split(" "), tagName)];
                                    patternValue = replaceIndex(patternValue, tagName,  tags[tagPosition].index , replacementValue);
                                    onPatternValueChange(newScenarioTemplate.rows[i], tagPosition, varType == "reference" ? varType : tagPosition.toString(), replacementValue)
                                    tagPosition = tagPosition + 1;

                                }
                                var tagRegex = /(@)\[\[(\d+):([\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+):([\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+)\]\]/gi
                                tag = tagRegex.exec(patternValue);
                            }
                            /** ---------------- **/
                            break;
                        }
                    } 
                }
                newScenarioTemplate.id = null;
                newScenarioTemplate.template = false;
                $scope.scenarii.push(newScenarioTemplate);
            }

            /** util functions */
            function getIndex(array, word){
                for(var i = 0 ; i< array.length; i++){
                    if(array[i] == word){
                        return i;
                    }
                }
            }

            function replaceIndex(string, regex, at, repl) {
               return string.replace(regex, function(match, i) {
                    if( i === at ) return repl;
                    return match;
                });
            }

            function __init__() {
                playRoutes.controllers.Application.loadConfiguration().get().then(function (response) {
                    $scope.configurations = response.data || [];
                    for (var i = 0; i < $scope.configurations.length; i++) {
                        for (var j = 0; j < $scope.configurations[i].rows.length; j++) {
                            $scope.scenario_types.push({
                                name: $scope.configurations[i].rows[j].name,
                                type: $scope.configurations[i].rows[j].type
                            });
                        }
                    }
                });

                playRoutes.controllers.Application.loadScenarii().get().then(function (response) {
                    var data = response.data || [];
                    data.map(function (scenario) {
                        try{
                            scenario.rows = angular.isObject(scenario.rows) ? scenario.rows : JSON.parse(scenario.rows);
                            var isTemplate = true;
                            for(var i = 0 ; i < scenario.rows.length ; i++){
                                if(angular.isDefined(scenario.rows[i].mappings) && scenario.rows[i].mappings.length > 0){
                                    isTemplate = false;
                                    break;
                                }
                            }
                            scenario.template = isTemplate;
                        }catch(e){
                            if(!angular.isObject(scenario.rows)){
                                //convert it into rows
                                var lines = scenario.rows.split( "\n" );
                                scenario.template = true;
                                scenario.rows = [];
                                for(var i = 0; i< lines.length; i++){
                                    scenario.rows.push({"patterns" : lines[i]});
                                }
                            }
                        }
                        return scenario;
                    });
                    $scope.scenarii = data;
                });
            }
            
        },
        ProjectCtrl: function ($rootScope, $scope, playRoutes, ngProgress, $window) {
            $scope.projects = [];


            playRoutes.controllers.Application.loadScenarii().get().then(function (response) {
                var data = response.data || [];
                $scope.scenarii = data;
            });

            $scope.isNotSaved = function (project) {
                return !angular.isDefined(project.id);
            }

            $scope.addProjectBlock = function () {
                $scope.projects.push({name: "project", campaigns: []});
            }

            $scope.addCampaignToProject = function (project) {
                project.campaigns.push({name: "new campaign", scenarii: []});
            }

            $scope.addScenarioToCampaign = function (campaign) {
                campaign.scenarii.push({});
            }

            $scope.deleteCampaign = function (campaign, project) {
                project.campaigns.splice(project.campaigns.indexOf(campaign), 1);
            }

            $scope.deleteScenario = function (scenario, campaign) {
                campaign.scenarii.splice(campaign.scenarii.indexOf(scenario), 1);
            }

            $scope.saveProject = function (project) {
                playRoutes.controllers.Application.saveProject().post(project).then(function (response) {
                    load();
                });
            }

            $scope.showDetails = function (scenario) {
                alert("TODO: Implement details display !")
            }

            $scope.disableProject = function (project) {
                alert("TODO: Implement disabling projects !")
            }

            $scope.displayReport = function (project) {
                $window.open("/loadProjectReport/" + project.name)
                playRoutes.controllers.Application.loadProjectReport(project.name).get().then(function (response) {
                    console.log(response)
                });
            }

            function load() {
                playRoutes.controllers.Application.loadProject().get().then(function (response) {
                    var data = response.data || [];
                    $scope.projects = data;
                });
            }

            load();
        },
        MainCtrl: function ($rootScope, $scope, playRoutes, $location) {
            playRoutes.controllers.Application.loadEnvConfiguration().get().then(function(response){
                $rootScope.jnlpHost = response.data || ""; 
            })
            $scope.logout = function () {
                playRoutes.controllers.Application.logout().get().then(function (response) {
                    $rootScope.user = "";
                    window.location.href = "/";
                });
            }
        }
    };
});