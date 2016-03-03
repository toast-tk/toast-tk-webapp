define(["angular"], function (angular) {
    "use strict";
    return {
        TreeLayoutService: function ($q) {
          var self = this ;
          self.concernedTreeNodePromise = $q.defer() ;
          self.selectedNodeCallback = []; 
            return {
              saveConcernedNode : saveConcernedNode,
              build : build,
              add : add,
              addSelectedNodeCallback : addSelectedNodeCallback 
            }

            /**/
            function build(treeContainer, dataTree , templateFunction){
              var treeExplorerPromise = $q.defer();
              self.dataTree = dataTree;
              var value = 
                webix.ready(function(){
                 var treeExplorer = new webix.ui({
                      container: treeContainer,
                      rows:[
                              {
                                view:"text",
                                label:"Filter scenarios",
                                labelPosition:"top"
                             },
                             {
                                view:"tree",
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
                               var selectedElementId = this.getSelectedId(true)
                               var selectedItem = this.getSelectedItem();

                               var text = "Selected: " + this.getSelectedId(true).join();
                                // document.getElementById(treeContainer).innerHTML = text;
                                if(angular.isDefined(self.selectedNodeCallback[treeContainer])){
                                 angular.forEach(self.selectedNodeCallback[treeContainer], function(callback){
                                  if(angular.isDefined(callback[1]) && callback[1](selectedElementId,selectedItem) === true){
                                    callback[0](selectedItem);
                                  } else if (!angular.isDefined(callback[1])){
                                    callback[0](selectedItem);
                                  }
                                });
                               }
                              }
                            }
                           }]   
                    });

                $$("$text1").attachEvent("onTimedKeyPress",function(){
                    $$("tree1").filter("#value#",this.getValue());
                })
                webix.event(window, "resize", function(){ treeExplorer.adjust(); })
                treeExplorerPromise.resolve(treeExplorer);
            });

                return treeExplorerPromise.promise;
            }

            /**/
            function saveConcernedNode(treeExplorer){
               self.concernedTreeNodePromise = $q.defer() ;
               webix.ready(function(){
                      var tree = treeExplorer.getChildViews()[1];
                      self.selectedTree  = treeExplorer.getChildViews()[1];
                      var parentId=  self.selectedTree.getSelectedId();
                      var selectedItem =  self.selectedTree.getSelectedItem();
                        if(parentId){
                          if((selectedItem.type==="folder" || ((angular.isDefined(selectedItem.data) || angular.isDefined(selectedItem.rows)) && selectedItem.type != []))){
                                  self.concernedNode = parentId;
                          } else {
                            self.concernedNode = tree.getParentId(parentId);
                           /* tree.add({value: newElementValue}, 0, tree.getParentId(parentId));*/
                          }
                        } else {
                          self.concernedNode = 0; //root node
                        }
                        self.concernedTreeNodePromise.resolve();
                   });
                return self.concernedTreeNodePromise.promise ;
            }

            function add(newElementValue){
              self.selectedTree.add( newElementValue, 0, self.concernedNode);
            }

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
}
}
});