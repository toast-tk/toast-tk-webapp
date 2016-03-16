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
              build : build,
              add : add,
              removeSelectedNode : removeSelectedNode,
              addSelectedNodeCallback : addSelectedNodeCallback,  
              adjustTreeSize : adjustTreeSize
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
                  ]},
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
              console.log("adding:", newElementValue, self.concernedNode);
              if(self.concernedNode != 0){
                  self.selectedTree.add( newElementValue, 0, self.concernedNode);  
              } else {
                   self.selectedTree.add( newElementValue, 0);  
              }
              
            }

            /* BEGIN : remove the selected node */
            function removeSelectedNode(){
              console.log("removing:", self.selectedNode);
              if(self.selectedNode != 0){
                  self.selectedTree.remove(self.selectedNode);  
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

}
}
});