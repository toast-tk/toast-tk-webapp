define(["angular"], function (angular) {
    "use strict";
    return {
        TreeLayoutService: function ($q, $timeout, $sideSplit) {
          var self = this ;
          self.concernedTreeNodePromise = $q.defer() ;
          self.selectedNodeCallback = []; 
          self.selectedNode = 0 ;
          self.concernedNode = 0 ;
            return {
              saveConcernedNode : saveConcernedNode,
              getConcernedNode : getConcernedNode,
              getSelectedNode : getSelectedNode,
              build : build,
              add : add,
              editSelectedNodeName : editSelectedNodeName,
              removeSelectedNode : removeSelectedNode,
              addSelectedNodeCallback : addSelectedNodeCallback,  
              adjustTreeSize : adjustTreeSize,
              getAllChildNodes: getAllChildNodes,
              selectNode: selectNode
            }

            function clearSelection(){
              self.selectedNode = 0 ;
              self.concernedNode = 0 ;
              delete self.selectedElementId;
              delete self.selectedItem;
            }

            /**/
            function build(treeContainer, dataTree , templateFunction){
              clearSelection();
              var treeExplorerPromise = $q.defer();
              self.dataTree = dataTree;
              if(angular.element('#'+ treeContainer).length){
                webix.ready(function(){
                 var treeExplorer = new webix.ui({
                  container: treeContainer,
                  rows:[
                        { cols:[
                                {
                                  template:"<i class='fa fa-filter fa-lg' style='margin-top: 10px;''></i>",
                                  type: "clean",
                                  width:20
                                },
                                {
                                  view:"text",
                                  id:"filterField"
                                }
                              ]   
                        },
                    {
                      view:"tree",
                      type:"lineTree",
                      activeTitle:true,
                      id:"tree1",
                      select:true,
                      template: templateFunction,
                      data : dataTree,
                      type:{
                            folder:function(obj, common){
                                 //if open folder
                                 if (obj.$count && obj.open) {
                                  return "<div class='webix_tree_folder_open'></div>";
                                }
                                 // if closed folder
                                 else if(obj.$count || obj.type == "folder") {
                                   return "<div class='webix_tree_folder'></div>";
                                 }
                                 return "<div class='webix_tree_file'></div>";
                               }
                             },
                             on:{
                              onSelectChange:function () {
                               var selectedElementId = this.getSelectedId(true);
                               self.selectedItem = this.getSelectedItem();
                               self.selectedElementId = selectedElementId[0];
                               var text = "Selected: " + this.getSelectedId(true).join();
                                // document.getElementById(treeContainer).innerHTML = text;
                                if(angular.isDefined(self.selectedNodeCallback[treeContainer])){
                                 angular.forEach(self.selectedNodeCallback[treeContainer], function(callback){
                                  if(angular.isDefined(callback[1]) && callback[1](self.selectedElementId,self.selectedItem) === true){
                                    callback[0](self.selectedItem);
                                  } else if (!angular.isDefined(callback[1])){
                                    callback[0](self.selectedItem);
                                  }
                                });
                               }
                             }
                           }
                         }]   
                       });

                 $$("filterField").attachEvent("onTimedKeyPress",function(){
                  $$("tree1").filter("#value#",this.getValue());
                })
                 webix.event(window, "resize", function(){ treeExplorer.adjust(); })
                 treeExplorerPromise.resolve(treeExplorer);
               });
              } else {
                console.log("could not build tree");
              }
              return treeExplorerPromise.promise;
            }

            /* BEGIN : save concerted node */
            /* @params : { treeExplorer : concerned tree , isParentConcerned : (boolean) to know if we want the selectednode or the parent}*/
            function saveConcernedNode(treeExplorer, isParentConcerned){
               self.concernedTreeNodePromise = $q.defer() ;
               webix.ready(function(){
                      self.selectedTree  = $$("tree1");
                      self.selectedNode  = self.selectedElementId;
                      var selectedItem  = self.selectedItem;
                        if(self.selectedNode){
                          if(isParentConcerned(selectedItem) === true){
                             self.concernedNode = self.selectedTree.getParentId(self.selectedNode) || 0;
                          } else {
                             self.concernedNode = self.selectedNode;
                           /* tree.add({value: newElementValue}, 0, tree.getParentId(parentId));*/
                          }
                        } else {
                          self.concernedNode = 0; //root node
                        }
                        self.concernedTreeNodePromise.resolve();
                   });
                return self.concernedTreeNodePromise.promise ;
            }
            /* END : save concerted node */

            function add(newElementValue){
              var createdPromise = $q.defer();
              console.log("adding:", newElementValue, "concerned", self.concernedNode);
              if(self.concernedNode != 0){
                  var newId = self.selectedTree.add( newElementValue, 0, self.concernedNode);  
              } else {
                  var newId = self.selectedTree.add( newElementValue, 0);  
              }
              if(newId != null){
                self.selectedNode = newId;
                $$("tree1").select(self.selectedNode);
                createdPromise.resolve(newId);
              } else{
                createdPromise.reject("could not create and catch id");
              }
              return createdPromise.promise;
            }

            /* BEGIN : edit the selected node */
            function editSelectedNodeName(newName){
              var nodeObj = $$("tree1").getItem(self.selectedNode);
              if(angular.isDefined(nodeObj)){
                  nodeObj.name = newName;
                  $$("tree1").updateItem(self.selectedNode, nodeObj);  
              }
            }
            /* END : edit the selected node */

            /* BEGIN : remove the selected node */
            function removeSelectedNode(){
              console.log("removing:", self.selectedNode);
              if(self.selectedNode != 0){
                  self.selectedTree.remove(self.selectedNode);  
                  clearSelection();
              } else {
                   console.log("select a node:");
              } 
            }
            /* END : remove the selected node */

            /* BEGIN : addSelectedNodeCallback */
            /* @params : {treeContainer : treeId , callback : function to execute on click , selectedItemConditionFn : (optional) callback excecution condition }*/
            function addSelectedNodeCallback(treeContainer, callback, selectedItemConditionFn){
              if(!angular.isDefined(self.selectedNodeCallback[treeContainer])){
                self.selectedNodeCallback[treeContainer] = [];
              }
              if(angular.isDefined(selectedItemConditionFn)){
                self.selectedNodeCallback[treeContainer].push([callback,selectedItemConditionFn]);  
              } else {
                self.selectedNodeCallback[treeContainer].push([callback]);  
              }
            }
            /* END : addSelectedNodeCallback */

            /* BEGIN : adjusting treeExplorer size */
            function adjustTreeSize(treeExplorer){
               $timeout(function(){
                 treeExplorer.adjust();
                 $$("treeTemplateContainer").attachEvent("onViewResize", function(){
                    treeExplorer.adjust();
                  });
               },0);
               $sideSplit.addCollapseCallBack(angular.element('#sidebarmenu'), function(isCollapsed){
                $timeout(function(){
                  treeExplorer.adjust();
                },0);
              });
           }

           /**/
           function getConcernedNode(){
            return self.concernedNode;
           }

           function getSelectedNode(){
            return self.concernedNode;
           }

           /* BEGIN : getting first level node */
           function getAllChildNodes(id){
            var childNodes = [];
            $$("tree1").data.eachChild(id, function(obj){ 
                childNodes.push(obj);
                console.log(obj.id); 
            });
            return childNodes ;
           }
           /* END : getting first level node */

           function selectNode(id){
            $$("tree1").select(id);
           }
}
}
});