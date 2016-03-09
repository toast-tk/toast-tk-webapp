define(["angular"], function (angular) {
    "use strict";
    return {
        Scenario1Ctrl: function ($rootScope, $scope, $q, playRoutes, ngProgress, ClientService, $sideSplit, $timeout, $modal, TreeLayoutService, ICONS, LayoutService) {
            $scope.isEditScenarioName = false;
            $scope.isCollapsed = false;
            $scope.ICONS = ICONS ;
            //plain json data, based on objects
            $scope.newRow = {};
            $scope.scenario_types = ["swing", "service", "web"];
            $scope.selectedType = "";
            $scope.importModes = ["prepend", "append"];
            $scope.scenarii = [];
            $scope.regexList = [];
            $scope.regexMap = [];
            $scope.scenario = undefined;
            $scope.stepType = "";

            $scope.add = add;
            $scope.addNewStep = addNewStep;
            $scope.newStepSelected = newStepSelected;
            $scope.save = save;
            $scope.deleteRow = deleteRow;
            $scope.importScenario = importScenario;
            $scope.onPatternValueChange = onPatternValueChange;
            $scope.convertToTemplate = convertToTemplate;
            $scope.editScenario = editScenario;
            $scope.deleteScenarii = deleteScenarii;
            $scope.addRowBefore = addRowBefore;

            __init__(true);
            
            function setDropListPositionClass(){
                if($scope.scenario.rows.length > 4){
                    $scope.dropListPosition = "angu-step-droptop";
                } else {
                    $scope.dropListPosition = "";
                }
            }
            function editScenario(scenario){
                $scope.scenario = scenario;
                setDropListPositionClass();
                swaptToDefaultRow();
            }

            function add(selectedType, selectedName, parentId) {
                playRoutes.controllers.ScenarioController.loadScenarioCtx(selectedType).get().then(function (response) {
                    var scenarioDescriptor = response.data;
                    var newScenario = {
                        name: selectedName,
                        parent: parentId.toString(),
                        type: selectedType,
                        driver: selectedType, //related service
                        columns: scenarioDescriptor,
                        rows: []
                    }
                    
                    if(!angular.isDefined(newScenario.data) && newScenario.type !="folder"){
                        $scope.scenarii.push(newScenario);
                        $scope.scenario = newScenario;
                        setDropListPositionClass();
                        $scope.stepType = selectedType;
                    }
                    save(newScenario);
                });
            };

            /* BEGIN : new step adding through autocomplete */
            var newStepPromise = $q.defer();
            function newStepSelected(newStep){
               var step =  {};
               step.kind = $scope.scenario.type ;
               if(angular.isDefined(newStep)){
                /*console.log("here",newStep);*/
                step['patterns'] = newStep.originalObject.typed_sentence;
                step.kind = newStep.description ;
                } else { //step vide ou ne fait pas partie de la liste
                    step['patterns'] = "";
                    newStepPromise.resolve(step);
                }
                newStepPromise = $q.defer();
                newStepPromise.resolve(step);
            }

            function addNewStep(){
                newStepPromise.promise.then(function(step){
                    console.log("   adding ;", angular.copy(step));
                    $scope.scenario.rows.push(angular.copy(step));
                    setDropListPositionClass();
                    $("#importActionsPanel").animate({ scrollTop: document.getElementById("importActionsPanel").scrollHeight }, "fast");
                    $scope.$broadcast('angucomplete-alt:clearInput', 'newStepAutocomplete');
                });
                
            }
            /* END : new step adding through autocomplete */

            function addRowBefore(scenario, newRow, currentRow) {

            };

            function deleteRow(scenario, row) {
                //ajax call directly, if not new !
                scenario.rows.splice(scenario.rows.indexOf(row), 1);
            };

            function save(scenario) {
                var scenarioCopy = angular.copy(scenario);
                scenarioCopy.rows = JSON.stringify(scenarioCopy.rows);
                delete scenarioCopy.columns;
                delete scenarioCopy.id;
                playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy).then(function () {
                    __init__(false);
                });
            };

            function saveScenarii(scenarii){
                var scenarioCopy = angular.copy(scenarii);
                scenarioCopy.rows = JSON.stringify(scenarioCopy.rows);
                delete scenarioCopy.columns;
                playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy).then(function () {
                    __init__(false);
                });

            }

            function deleteScenarii(scenario){
                playRoutes.controllers.ScenarioController.deleteScenarii().post(angular.toJson(scenario.id)).then(function () {
                    __init__(false);
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

            function convertToTemplate(scenario){
                var newScenarioTemplate = scenario;
                for(var i = 0 ; i < newScenarioTemplate.rows.length ; i++){
                    var actionType = getActionType(newScenarioTemplate, newScenarioTemplate.rows[i]) || 'swing';
                    newScenarioTemplate.rows[i].kind = actionType;
                    var regexList = $scope.regexMap[actionType]; 
                    var sentence = removeHeadAnnotation(newScenarioTemplate.rows[i].patterns);
                    for(var j=0; j < regexList.length; j++){
                        var replacedSentence = ClientService.convertToRegexSentence(regexList[j].typed_sentence);
                        var regex = new RegExp(replacedSentence, 'i');
                        if(regex.test(sentence)){
                            var typeSentence = regexList[j].typed_sentence;
                            var pattern = ClientService.convertToPatternSentence(typeSentence);
                            var scenarioRow = newScenarioTemplate.rows[i];
                            setMappingForScenarioRow(scenarioRow, pattern, typeSentence);
                            break;
                        }
                    } 
                }
                newScenarioTemplate.template = false;
                saveScenarii(newScenarioTemplate);
            }

            function removeHeadAnnotation(sentence){
                var regex = /(swing|web|service|driverLess):?([\w]*)? ([\w\W]+)/
                var tail;
                if(tail = regex.exec(sentence)){
                    return tail[3];
                }
                return sentence;
            }

            function getActionType(scenario, row){
                if(row.patterns.startsWith("@service")){
                    return "service";
                }
                else if (row.patterns.startsWith("@web")){
                    return "service";
                }
                else if (row.patterns.startsWith("@swing")){
                    return "swing";
                }
                else {
                    return scenario.type;
                }
            }

            function setMappingForScenarioRow(scenarioRow, pattern, typeSentence){
                var scenarioSentenceWithValues = scenarioRow.patterns;
                scenarioRow.patterns = typeSentence;
                var patternValue = pattern;
                var tag = getRegexTag(patternValue);
                var tags = [];
                var tagPosition = 0;
                while (tag != null) {
                    tags.push(tag);
                    var tagName = tags[tagPosition][0];
                    var varType = tags[tagPosition][3];
                    var mappingValue = scenarioSentenceWithValues.split(" ")[getIndex(pattern.split(" "), tagName)];
                    patternValue = replaceIndex(patternValue, tagName,  tags[tagPosition].index , mappingValue);
                    mappingValue = mappingValue.replace(/\*/g, '');
                    onPatternValueChange(scenarioRow, tagPosition, varType == "component" ? varType : tagPosition.toString(), mappingValue);
                    tagPosition = tagPosition + 1;
                    tag = getRegexTag(patternValue);
                }
            }

            //performs model update
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
                        row.mappings.push(newVal);
                    }
                }
            }



            /** util functions */
            function getRegexTag(sentence){
                var tagRegex = /(@)\[\[(\d+):([\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+):([\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+)\]\]/gi
                var tag = tagRegex.exec(sentence);
                return tag;
            }

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

         $scope.regexFullList=[];

         function toTreeDataList(flat){
            var nodes = [];
            var toplevelNodes = [];
            var lookupList = {};

            for (var i = 0; i < flat.length; i++) {
                flat[i].data = []
                lookupList[flat[i].id] = flat[i];
                nodes.push(flat[i]);
                if (flat[i].parent == null || flat[i].parent == 0) {
                    toplevelNodes.push(flat[i]);
                }
            }

            for (var i = 0; i < nodes.length; i++) {
              var n = nodes[i];
              if (!(n.parent == 0 || n.parent == null)) {
                    if(angular.isDefined(lookupList[n.parent])){
                  lookupList[n.parent].data = lookupList[n.parent].data.concat([n]);
              }
              }
            }
            return toplevelNodes;
         }

         function __init__(doBuildTree) {
            for(var i =0 ; i < $scope.scenario_types.length; i++){
                var scenariiKind = $scope.scenario_types[i];
                ClientService.loadRegexList(scenariiKind, function(scenariiKind, list){
                    $scope.regexList = $scope.regexList.concat(list || []);
                    $scope.regexMap[scenariiKind] = list;
                    angular.forEach(list,function(value,key){
                        value.kind = scenariiKind;
                        $scope.regexFullList.push(value);
                    });
                });
            }   

            playRoutes.controllers.ScenarioController.loadScenarii().get().then(function (response) {
                var data = response.data || [];
                data.map(function (scenario) {
                    scenario.template = isTemplate;
                        scenario.value = scenario.name; // todo : fix: pour la recherche 
                        try{
                            scenario.rows = angular.isObject(scenario.rows) ? scenario.rows : JSON.parse(scenario.rows);
                            var isTemplate = true;
                            for(var i = 0 ; i < scenario.rows.length ; i++){
                                if(angular.isDefined(scenario.rows[i].mappings) && scenario.rows[i].mappings.length > 0){
                                    isTemplate = false;
                                    break;
                                }
                            }
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
                console.log("all scenarii", $scope.scenarii);
                $scope.scenarii = data;
                if(angular.isDefined($scope.scenarii) && $scope.scenarii.length != 0){
                    $scope.senariiTree = toTreeDataList(data);    
                } else {
                    console.warn("no scenarii", $scope.scenarii);
                }
                

                /* begin : adjusting page content size */
                $scope.effectContentWidth = LayoutService.reAdjustContentSize();
                webix.event(window, "resize", function(){LayoutService.reAdjustContentSize()});
                $sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(){LayoutService.reAdjustContentSize()});
                /* end : adjusting page content size */

                /* begin : generation de la tree */
                if(doBuildTree === true){
                    var treeExplorerPromise =  TreeLayoutService.build("toastScenariosTreeExplorer", $scope.senariiTree,
                        function(obj, common){
                            if(!angular.isDefined(obj.image) || obj.image == null){
                                obj.image = ICONS[obj.type];         
                            }
                            return common.icon(obj,common)+ "<i class='"+ obj.image +"' style='float:left; margin:3px 4px 0px 1px;'> </i>" + obj.name;
                        });

                    treeExplorerPromise.then(function(treeExplorer){
                        TreeLayoutService.adjustTreeSize(treeExplorer);
                        $scope.addNodeToParent = function(nodeType){
                            TreeLayoutService.saveConcernedNode(treeExplorer, function(selectedItem){
                                return (!angular.isDefined(selectedItem.data) && selectedItem.type !="folder"); /*selectedItem.type !="folder"*/
                            }).then(function(){
                                var modalScope = $scope.$new(true);
                                modalScope.newNodeType = nodeType;
                                var modalInstance = $modal.open({
                                    animation: $scope.animationsEnabled,
                                    templateUrl: 'assets/html/scenario/newstep.modal.scenario.html',
                                    controller:'newStepModalCtrl',
                                    scope : modalScope
                                });

                                modalInstance.result.then(function(newScenario){

                                 add(newScenario.type, newScenario.name, newScenario.$parent);
                             });
                            });    
                        }
                    });
/* end : generation de la tree */

TreeLayoutService.addSelectedNodeCallback("toastScenariosTreeExplorer", function(selectedScenario){
    $scope.scenario = selectedScenario ;
    setDropListPositionClass();
    $timeout(function(){
        $("#importActionsPanel").animate({ scrollTop: document.getElementById("importActionsPanel").scrollHeight }, "slow");
    },500);
    $scope.$apply();
}, function(selectedElementId,selectedItem){
    return selectedElementId && selectedItem.type!="folder";
});

}   
/* end: doBuildTree */
            });
        }
    }
    };
});