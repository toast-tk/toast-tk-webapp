define(["angular"], function (angular) {
  "use strict";
  return {
    UtilsScenarioService: function ($q) {
      var self = this ;

      return {
        getRegexTag : getRegexTag,
        getIndex: getIndex,
        replaceIndex: replaceIndex,
        toTreeDataList : toTreeDataList
      }



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


    }
    /* END : UtilsScenarioService function */
  }
});