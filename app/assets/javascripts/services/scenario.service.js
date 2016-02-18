define(["angular"], function (angular) {
    "use strict";
    return {
        ScenarioService: function ($q) {
          var self = this ;
          self.selectedNodeCallback = [];
            return {
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
            function addToExplorerTree(newElementValue, treeExplorer){
               webix.ready(function(){
                      var tree = treeExplorer.getChildViews()[1];
                      var parentId= tree.getSelectedId();
                      var selectedItem = tree.getSelectedItem();
                        if(parentId 
                            && (selectedItem.type==="folder" 
                            || (angular.isDefined(selectedItem.data) && selectedItem.type != []))){
                                   tree.add( {value:newElementValue}, 0, parentId);
                            }
                        else if(parentId){
                             tree.add({value: newElementValue}, 0, tree.getParentId(parentId));
                        }
                            else {
                                    webix.alert("Select a folder");
                            }
                   });
            }

            /**/
            function addSelectedNodeCallback(callback){
                self.selectedNodeCallback.push(callback);
            }



}
}
});