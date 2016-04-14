define(["angular"], function (angular) {
    "use strict";
    return {
        ScenarioCtrl: function ($rootScope, $scope, $q, playRoutes, ngProgress, ClientService, $sideSplit, $timeout, $uibModal, TreeLayoutService, ICONS, LayoutService, NewStepService, UtilsScenarioService, toastr) {
            $scope.isEditScenarioName = false;
            $scope.isCollapsed = false;
            $scope.ICONS = ICONS ;
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
            $scope.recordActions= recordActions;
            $scope.driver = undefined;


            /**
             * ClientService
             */
            ClientService.setDriverListener(function(data){
                $scope.$apply(function(){
                    $scope.driver = data;
                })
            });

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

            function recordActions(){
                ClientService.setSentenceListener(function(data){
                    if(!angular.isObject(data.sentence)){
                        data.row = {
                            "patterns" : data.sentence
                        }
                        UtilsScenarioService.templatizeRow(data.row, "web", data.ids);
                        console.log("data.row : ", JSON.stringify(data.row));
                        $scope.scenario.rows.push(angular.copy(data.row));
                    }
                });
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

            }

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

            $scope.changeEditedStep= changeEditedStep ;
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
                UtilsScenarioService.convertToTemplate(scenario).then(function(newScenarioTemplate){
                    saveScenarii(newScenarioTemplate);
                });
            }

            function onPatternValueChange(scenarioRow, pattern, typeSentence){
                UtilsScenarioService.onPatternValueChange(scenarioRow, pattern, typeSentence, null);
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

    playRoutes.controllers.ScenarioController.loadScenarii().get().then(function (response) {
        var data = response.data || [];
        data.map(function (scenario) {
                        scenario.value = scenario.name; // todo : fix: pour la recherche 
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
    })
    if(angular.isDefined(data) && data.length != 0){
        $scope.senariiTree = UtilsScenarioService.toTreeDataList(data);    
    } else {
        console.warn("no data nodes");
    }


/* begin : adjusting page content size */
$scope.effectContentWidth = LayoutService.reAdjustContentSize();
webix.event(window, "resize", function(){LayoutService.reAdjustContentSize()});
$sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(){LayoutService.reAdjustContentSize()});
/* end : adjusting page content size */

/* begin : generation de la tree */
// FIX TODO : l'initiatisation crée une boucle infinie 
if(doBuildTree === true){
    $scope.scenarii.map(function (scenario) {
        if(scenario.template === true ){
            convertToTemplate(scenario);
        }
    });
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
        $scope.editableStepIndex = null;
        $scope.scenario = selectedScenario ;
        $scope.folder = null;
        setDropListPositionClass();
        $timeout(function(){
            $("#importActionsPanel").animate({ scrollTop: document.getElementById("importActionsPanel").scrollHeight }, "slow");
        },500);
        // $scope.$apply();
    }, function(selectedElementId,selectedItem){
        return selectedElementId && selectedItem.type!="folder";
    });

    TreeLayoutService.addSelectedNodeCallback("toastScenariosTreeExplorer", function(selectedFolder){
        $scope.scenario = null ;
        $scope.folder = selectedFolder;
        $scope.folderContents = TreeLayoutService.getAllChildNodes(selectedFolder.id);
        //$scope.$apply();
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