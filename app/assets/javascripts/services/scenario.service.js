define(["angular"], function (angular) {
    "use strict";
    return {
        ScenarioService: function ($q) {
          var self = this ;
          self.concernedTreeNodePromise = $q.defer() ;
          self.selectedNodeCallback = [];
            return {
              saveConcernedTreeNode : saveConcernedTreeNode,
              buildExplorerTree : buildExplorerTree,
              addToExplorerTree : addToExplorerTree,
              addSelectedNodeCallback : addSelectedNodeCallback  
            }

            /**/
            function buildExplorerTree(treeContainer, dataTree){
              var treeExplorerPromise = $q.defer();
                webix.ready(function(){
/*                    var dataTree = [
                                    { id:"1", open:true, value:"The Shawshank", type:'folder', data:[
                                        { id:"124523450.", value:"Part 1" },
                                        { id:"124734758373", value:"Part 2" },
                                        { id:"1vgdfgdg", value:"Part 3" }
                                    ]},
                                    { id:"2", value:"The Godfather", type:'folder', data:[
                                        { id:"2.1", value:"Part 1" },
                                        { id:"2.2", value:"Part 2" }
                                    ]},
                                    { id:"3", value:"wierd folder1"},
                                    { id:"4", value:"wierd folder1", data:[]},
                                    { id:"5", value:"empty folder", type:'folder'}
                            ];*/
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
                                template:"{common.icon()} <i class='#image#' style='float:left; margin:3px 4px 0px 1px;'> </i> #name#",
                                data : webix.copy(dataTree),
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
                                   if(selectedElementId && selectedItem.type!="folder"){
                                      angular.forEach(self.selectedNodeCallback, function(callback){
                                            callback(selectedItem);
                                      });
                                    }
                                    else {
                                           //webix.alert("Selected is not a file");
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
            function saveConcernedTreeNode(treeExplorer){
               self.concernedTreeNodePromise = $q.defer() ;
               webix.ready(function(){
                      var tree = treeExplorer.getChildViews()[1];
                      self.selectedTree  = treeExplorer.getChildViews()[1];
                      var parentId=  self.selectedTree.getSelectedId();
                      var selectedItem =  self.selectedTree.getSelectedItem();
                        if(parentId){
                          if((selectedItem.type==="folder" || (angular.isDefined(selectedItem.data) && selectedItem.type != []))){
                                  self.concernedNode = parentId;
                          } else {
                            self.concernedNode = tree.getParentId(parentId);
                           /* tree.add({value: newElementValue}, 0, tree.getParentId(parentId));*/
                          }
                            self.concernedTreeNodePromise.resolve();
                        } else {
                              webix.alert("Select a folder");
                              self.concernedTreeNodePromise.reject();
                        }
                   });
                return self.concernedTreeNodePromise.promise ;
            }

            function addToExplorerTree(newElementValue){
              console.log("new node name",newElementValue);
                  self.selectedTree.add( newElementValue, 0, self.concernedNode);
            }

            /**/
            function addSelectedNodeCallback(callback){
                self.selectedNodeCallback.push(callback);
            }



}
}
});