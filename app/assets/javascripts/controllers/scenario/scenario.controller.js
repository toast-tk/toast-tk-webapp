define(["angular"], function (angular) {
    "use strict";
    return {
        Scenario1Ctrl: function ($rootScope, $scope, $q, playRoutes, ngProgress, ClientService, $sideSplit, $timeout, $modal, TreeLayoutService, ICONS, LayoutService, toastr) {
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

            $scope.addNewStep = addNewStep;
            $scope.newStepSelected = newStepSelected;
            $scope.saveScenarii = saveScenarii;
            $scope.deleteRow = deleteRow;
            $scope.importScenario = importScenario;
            $scope.onPatternValueChange = onPatternValueChange;
            $scope.convertToTemplate = convertToTemplate;
            $scope.editScenario = editScenario;
            $scope.deleteScenarii = deleteScenarii;
            $scope.addRowBefore = addRowBefore;
            $scope.selectNode = selectNode;

            function selectNode(id){
                TreeLayoutService.selectNode(id);
            }
            /* tree build promise */
            var treeExplorerPromise = $q.defer();

            treeExplorerPromise.promise.then(function(treeExplorer){
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
                         newScenario.rows = angular.isObject(newScenario.rows) ? newScenario.rows : JSON.parse(newScenario.rows);
                         add(newScenario);
                     });
                    });    
                }

                $scope.$watch('scenario.name',function(newValue){
                    if(angular.isDefined(newValue)){
                        TreeLayoutService.saveConcernedNode(treeExplorer, function(selectedItem){
                            return (!angular.isDefined(selectedItem.data) && selectedItem.type !="folder");
                        }).then(function(){
                            TreeLayoutService.editSelectedNodeName(newValue);
                        });
                    }
                })
                $scope.$watch('folder.name',function(newValue){
                    if(angular.isDefined(newValue)){
                        TreeLayoutService.saveConcernedNode(treeExplorer, function(selectedItem){
                            return (!angular.isDefined(selectedItem.data) && selectedItem.type =="folder");
                        }).then(function(){
                            TreeLayoutService.editSelectedNodeName(newValue);
                        });
                    }
                })
            });

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

            function add(newScenario) {
                __init__(false);
                if(!angular.isDefined(newScenario.data) && newScenario.type !="folder"){
                        $scope.scenarii.push(newScenario);
                        /*delete newScenario.id ;*/
                        $scope.scenario = newScenario;
                        setDropListPositionClass();
                        $scope.stepType = newScenario.type;
                    }
                toastr.success('Scenario created !');
            };

            /* BEGIN : step structure builder for edit and add */
            function buildSelectedStep(newStep){
             var promise = $q.defer();
             var isResolved ;                
             var step =  {};
             step.kind = $scope.scenario.type ;
             if(angular.isDefined(newStep)){
                step['patterns'] = newStep.originalObject.typed_sentence;
                step.kind = newStep.description ;
                promise.resolve(step);
                isResolved  = true;
                }else{
                    step['patterns'] ="";
                    promise.resolve(step);
                    isResolved  = true;
                }
                return {promise: promise,
                        isResolved :isResolved};
            }

            function buildCustomStep(newCustomStep){
                var promise = $q.defer();                
                var step =  {};
                step.kind = $scope.scenario.type ;
                step['patterns'] = newCustomStep;
                promise.resolve(step);
                return promise;
            }
            /* BEGIN : step structure builder for edit and add */

            /* BEGIN : new step adding through autocomplete */
            var newStepPromise = $q.defer();
            var isNewStepResolved = false;
            function newStepSelected(newStep){
             var response = buildSelectedStep(newStep);
             newStepPromise = response.promise;
             isNewStepResolved = (response.isResolved == true) ? response.isResolved : isNewStepResolved;
            }

            function newCustomStepSelected(newCustomStep){
                newStepPromise = buildCustomStep(newCustomStep);
                isNewStepResolved = true;
            }

            function addNewStep(){
                if(isNewStepResolved==false){
                    console.log("eef ", $scope.newStepModel)
                    newCustomStepSelected("");
                }

                newStepPromise.promise.then(function(step){
                    isNewStepResolved = false;
                    console.log("   adding ;", angular.copy(step));
                    $scope.scenario.rows.push(angular.copy(step));
                    setDropListPositionClass();
                    $("#importActionsPanel").animate({ scrollTop: document.getElementById("importActionsPanel").scrollHeight }, "fast");
                    $scope.$broadcast('angucomplete-alt:clearInput', 'newStepAutocomplete');
                });
            }
            /* END : new step adding through autocomplete */

            /* BEGIN : step editing */
            $scope.editableStepIndex; // TODO : init when change scenario
            $scope.setEditableStep = setEditableStep ;
            var currentStep ;
            function setEditableStep(stepIndex, row){
                $scope.editableStepIndex = stepIndex;
                currentStep= row;
            }

            $scope.changeEditedStep= changeEditedStep ;
            function changeEditedStep(){
                if(isNewStepResolved==false){
                    newCustomStepSelected(currentStep['patterns']);
                }

                newStepPromise.promise.then(function(step){
                    isNewStepResolved = false;
                    console.log("editing :", angular.copy(step));
                    $scope.scenario.rows[$scope.editableStepIndex] = step;
                    $scope.editableStepIndex = null;
                });    
            }

            /*END : step editing */

            function addRowBefore(scenario, newRow, currentRow) {

            };

            function deleteRow(scenario, row) {
                //ajax call directly, if not new !
                scenario.rows.splice(scenario.rows.indexOf(row), 1);
                setDropListPositionClass();
            };

            function saveScenarii(scenarii){
                var scenarioCopy = angular.copy(scenarii);
                scenarioCopy.rows = JSON.stringify(scenarioCopy.rows);
                delete scenarioCopy.columns;
                playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy).then(function () {
                    __init__(false);
                    toastr.success('Saved !');
                }, function(){
                    toastr.error('Could Not save changed details !');
                });

            }

            function deleteScenarii(scenario){
                playRoutes.controllers.ScenarioController.deleteScenarii().post(angular.toJson(scenario.id)).then(function () {
                    __init__(false);
                    treeExplorerPromise.promise.then(function(treeExplorer){
                        TreeLayoutService.saveConcernedNode(treeExplorer, function(selectedItem){
                            return (!angular.isDefined(selectedItem.data)); 
                        }).then(function(){
                            TreeLayoutService.removeSelectedNode();
                            var node =$scope.scenario || $scope.folder;
                             toastr.success("deleted: \'"+ node.name + "\' !");
                             $scope.scenario = null;
                             $scope.folder = null;
                        })
                    });
                }, function(){
                     toastr.error("Error: has child node!");
                });
            }

            function importScenario(scenario) {
                var mode = scenario.selectedImportMode;
                var toImport = scenario.imp;
                if (mode == "prepend") {
                    scenario.rows = angular.copy(toImport.rows).concat(scenario.rows);
                    toastr.success(" Scenario imported (prepend) !");
                } else if (mode == "append") {
                    scenario.rows = scenario.rows.concat(angular.copy(toImport.rows));
                    toastr.success(" Scenario imported (append) !");
                } else {
                    toastr.error("Could not import Scenario !");
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
/*    console.log("all scenarii", $scope.scenarii, data);*/
    $scope.scenarii= [];
    angular.forEach(data, function(dataRow){
        if(dataRow.type!="folder"){
            $scope.scenarii.push(dataRow);    
        }
    })
    if(angular.isDefined(data) && data.length != 0){
        $scope.senariiTree = toTreeDataList(data);    
    } else {
        console.warn("no data nodes");
    }


/* begin : adjusting page content size */
$scope.effectContentWidth = LayoutService.reAdjustContentSize();
webix.event(window, "resize", function(){LayoutService.reAdjustContentSize()});
$sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(){LayoutService.reAdjustContentSize()});
/* end : adjusting page content size */

/* begin : generation de la tree */
if(doBuildTree === true){
    TreeLayoutService.build("toastScenariosTreeExplorer", $scope.senariiTree,
        function(obj, common){
            if(!angular.isDefined(obj.image) || obj.image == null){
                obj.image = ICONS[obj.type];         
            }
            return common.icon(obj,common)+ "<i class='"+ obj.image +"' style='float:left; margin:3px 4px 0px 1px;'> </i>" + obj.name;
        }).then(function(treeExplorer){
            treeExplorerPromise.resolve(treeExplorer);
        });

    /* end : generation de la tree */

    TreeLayoutService.addSelectedNodeCallback("toastScenariosTreeExplorer", function(selectedScenario){
        $scope.scenario = selectedScenario ;
        $scope.folder = null;
        setDropListPositionClass();
        $timeout(function(){
            $("#importActionsPanel").animate({ scrollTop: document.getElementById("importActionsPanel").scrollHeight }, "slow");
        },500);
        $scope.$apply();
    }, function(selectedElementId,selectedItem){
        return selectedElementId && selectedItem.type!="folder";
    });

    TreeLayoutService.addSelectedNodeCallback("toastScenariosTreeExplorer", function(selectedFolder){
        $scope.scenario = null ;
        $scope.folder = selectedFolder;
        $scope.folderContents = TreeLayoutService.getAllChildNodes(selectedFolder.id);
        $scope.$apply();
    }, function(selectedElementId,selectedItem){
        return selectedElementId && selectedItem.type=="folder";
    });

}   
/* end: doBuildTree */
});
}
}
};
});