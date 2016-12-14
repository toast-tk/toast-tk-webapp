(function() {
    "use strict";

    angular.module("app").controller("ScenarioCtrl", ScenarioCtrl);

    function ScenarioCtrl($rootScope, $scope, $q, playRoutes,
                                ngProgress, ClientService, $sideSplit, $timeout,
                                $uibModal, ICONS, LayoutService,
                                NewStepService, UtilsScenarioService, toastr,
                                defaultProject) {

            $scope.defaultProject = defaultProject;
            $scope.isEditScenarioName = false;
            $scope.isCollapsed = false;
            $scope.ICONS = ICONS ;
            $scope.senariiTree =[];
            //plain json data, based on objects
            $scope.newRow = {};
            $scope.scenario_types = ["swing", "service", "web"];
            $scope.selectedType = "";
            $scope.importModes = ["prepend", "append"];
            $scope.scenarii = [];
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
            $scope.agentIsActive = true;
            $scope.agents = [];
            $scope.agent = [];

            $scope.agentDropdownSettings = {
                selectionLimit: 1,
                displayProp: 'host',
                idProp: 'token',
                externalIdProp: 'token',
                showCheckAll: false,
                showUncheckAll: false,
                buttonClasses: 'btn btn-xs btn-success'
            };

            $scope.translationTexts = {
                uncheckAll: 'Stop recording',
                buttonDefaultText: 'No Agent Selected',
                dynamicButtonTextSuffix: ' - Recording is Active'
            };

        /* FS EXPLORER */
        $scope.addNodeToParent = function(nodeType){
                var modalScope = $scope.$new(true);
                modalScope.newNodeType = nodeType;
                if($scope.currentPath[$scope.currentPath.length - 1]){
                    modalScope.newNodeparent =  $scope.currentPath[$scope.currentPath.length - 1]._id ;
                }
                modalScope.project = $scope.defaultProject;
                var modalInstance = $uibModal.open({
                    animation: $scope.animationsEnabled,
                    templateUrl: 'assets/html/scenario/newstep.modal.scenario.html',
                    controller:'newStepModalCtrl',
                    scope : modalScope
                });

                modalInstance.result.then(function(newScenario){
                    newScenario.rows = angular.isObject(newScenario.rows) ? newScenario.rows : JSON.parse(newScenario.rows);
                    add(newScenario);
                });
        };

        $scope.fsExplorerOptions = {
            nodeId: "_id",
            sortBy: 'type',
            isAccessibleNode: function(node){
                return (node.type === 'folder');
            }
        };

        $scope.currentPath = [];
        $scope.changedPath = function(path){
            $scope.currentPath = path; //TODO: show in ui
        };

        $scope.clickedNode = function(selectedNode){
            if(selectedNode.type!="folder"){
                $scope.editableStepIndex = null;
                $scope.scenario = selectedNode ;
                $scope.folder = null;
                setDropListPositionClass();
                $timeout(function(){
                    $("#importActionsPanel").animate({ scrollTop: document.getElementById("importActionsPanel").scrollHeight }, "slow");
                },500);
            } else {
                $scope.scenario = null ;
                $scope.folder = selectedNode;
                //$scope.folderContents = TreeLayoutService.getAllChildNodes(selectedNode._id);
            }
        };

        /* FS EXPLORER */

        ClientService.registerAgentListener(function(order, info){
                if(order === 'set'){
                    if(!$scope.$$phase) {
                      $scope.$apply(function() {
                        $scope.agents = info || [];
                      });
                    }else {
                        $scope.agents = info || [];
                    }
                    
                }
                if(order === 'unset'){
                    if(!$scope.$$phase) {
                      $scope.$apply(function() {
                        if($scope.agent && info.token === $scope.agent.token){
                            $scope.agent = undefined;
                        }
                      });
                    }else {
                        if($scope.agent && info.token === $scope.agent.token){
                            $scope.agent = undefined;
                        }
                    }
                    
                }
                if(order === 'sentence'){
                    //received sentence comes from selected agent
                    if($scope.agent && info.token === $scope.agent.token){
                        var data = info.sentence;
                        if(!$scope.$$phase) {
                          $scope.$apply(function(){
                            if(!angular.isObject(data.sentence)){
                                data.row = {
                                    "patterns" : data.sentence
                                }
                                UtilsScenarioService.templatizeRow(data.row, "web", data.ids);
                                console.log("data.row : ", JSON.stringify(data.row));
                                $scope.scenario.rows.push(angular.copy(data.row));
                            }
                          });
                        }else {
                            if(!angular.isObject(data.sentence)){
                                data.row = {
                                    "patterns" : data.sentence
                                }
                                UtilsScenarioService.templatizeRow(data.row, "web", data.ids);
                                console.log("data.row : ", JSON.stringify(data.row));
                                $scope.scenario.rows.push(angular.copy(data.row));
                            }
                        }
                    }
                }
                $scope.agentIsActive = ClientService.socketIsActive && $scope.agents.length > 0;
            });

            $scope.selectNode = selectNode;
            function selectNode(id){
                TreeLayoutService.selectNode(id);
            }

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
                    $scope.folder = null;
                    $scope.scenario = newScenario;
                    setDropListPositionClass();
                    $scope.stepType = newScenario.type;
                }
                toastr.success('Scenario created !');
            }

            /* BEGIN : autocomplete step manipulation */
            var newStepPromise = $q.defer();
            var isNewStepResolved = false;
            function newStepSelected(newStep){
                var response = NewStepService.buildSelectedStep(newStep, $scope.scenario.type);
                newStepPromise = response.promise;
                isNewStepResolved = (response.isResolved == true) ? response.isResolved : isNewStepResolved;
            }

            var newCostomStep ;
            $scope.newStepChanged = function(customTypedStep){
                console.log("newStep", customTypedStep);
                newCostomStep = customTypedStep ;

            };

            function newCustomStepSelected(newCustomStep){
                var step = { kind : $scope.scenario.type ,
                    patterns : newCustomStep};
                newStepPromise = NewStepService.buildCustomStep(step);
                isNewStepResolved = true;
            }
            /* END : autocomplete step manipulation */

            /* BEGIN : new step adding through autocomplete */
            function addNewStep(){
                if(isNewStepResolved==false){
                    console.log("eef ", $scope.newStepModel)
                    newCustomStepSelected(newCostomStep);
                }

                newStepPromise.promise.then(function(step){
                    if(step.patterns === ""){
                        step.patterns = newCostomStep ;
                    }
                    newCostomStep = "";
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

            $scope.changeEditedStep = changeEditedStep;
            function changeEditedStep(){
                if(isNewStepResolved==false){
                    newCustomStepSelected(currentStep['patterns']);
                }

                newStepPromise.promise.then(function(step){
                    if(step.patterns === ""){
                        step.patterns = newCostomStep ;
                    }
                    newCostomStep = "";
                    isNewStepResolved = false;
                    console.log("editing :", angular.copy(step));
                    $scope.scenario.rows[$scope.editableStepIndex] = step;
                    $scope.editableStepIndex = null;
                });
            }
            /*END : step editing */

            function addRowBefore(scenario, newRow, currentRow) {

            }

            function deleteRow(scenario, row) {
                //ajax call directly, if not new !
                scenario.rows.splice(scenario.rows.indexOf(row), 1);
                setDropListPositionClass();
            }

            function saveScenarii(scenarii){
                var scenarioCopy = angular.copy(scenarii);
                scenarioCopy.rows = JSON.stringify(scenarioCopy.rows);
                delete scenarioCopy.columns;
                scenarioCopy.project = $scope.defaultProject;
                playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy).then(function () {
                    __init__(false);
                    toastr.success('Saved !');
                }, function(){
                    toastr.error('Could Not save changed details !');
                });

            }

            function deleteScenarii(scenario){
                playRoutes.controllers.ScenarioController.deleteScenarii().post(angular.toJson(scenario._id)).then(function () {
                    __init__(false);
                    var node =$scope.scenario || $scope.folder;
                    toastr.success("deleted: \'"+ node.name + "\' !");
                    $scope.scenario = null;
                    $scope.folder = null;
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
            }

            function convertToTemplate(scenario){
                UtilsScenarioService.convertToTemplate(scenario).then(function(newScenarioTemplate){
                    saveScenarii(newScenarioTemplate);
                });
            }

            function onPatternValueChange(scenarioRow, position, identifier, value){
                UtilsScenarioService.onPatternValueChange(scenarioRow, position, identifier, value);
            }

            $scope.regexFullList=[];

            function __init__(doBuildTree) {
                for(var i =0 ; i < $scope.scenario_types.length; i++){
                    var scenariiKind = $scope.scenario_types[i];
                    ClientService.loadRegexList(scenariiKind, function(scenariiKind, list){
                        UtilsScenarioService.setRegexList(scenariiKind, list);
                        angular.forEach(list,function(value,key){
                            value.kind = scenariiKind;
                            $scope.regexFullList.push(value);
                        });
                    });
                }

                playRoutes.controllers.ScenarioController.loadScenarii($scope.defaultProject._id).get().then(function (response) {
                    var data = response.data || [];
                    data.map(function (scenario) {
                        scenario.value = scenario.name;
                        try{
                            scenario.rows = angular.isObject(scenario.rows) ? scenario.rows : JSON.parse(scenario.rows);
                            scenario.template  = true;
                            if(scenario.rows>0){
                                for(var i = 0 ; i < scenario.rows.length ; i++){
                                    if(angular.isDefined(scenario.rows[i].mappings) && scenario.rows[i].mappings.length > 0){
                                        scenario.template  = false;
                                        break;
                                    }
                                }
                            } else {
                                scenario.template  = false;
                            }
                        }catch(e){
                            if(!angular.isObject(scenario.rows)){
                                /*convert it into rows*/
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
                    });
                    if(angular.isDefined(data) && data.length != 0){
                        $scope.senariiTree = data ;
                    } else {
                        console.warn("no data nodes");
                    }

                    /* begin : generation de la tree */
                    // FIX TODO : l'initiatisation crée une boucle infinie
                    if(doBuildTree === true){
                        $scope.scenarii.map(function (scenario) {
                            if(scenario.template === true ){
                                convertToTemplate(scenario);
                            }
                        });
                    }
                    /* end: doBuildTree */
                });
            }

        }
})();