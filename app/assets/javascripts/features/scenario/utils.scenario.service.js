define(["angular"], function (angular) {
  "use strict";
  return {
    UtilsScenarioService: function ($q, ClientService) {
      var self = this ;
      self.regexMap = [];
      return {
        toTreeDataList : toTreeDataList,
        getActionType: getActionType,
        setRegexList: setRegexList,
        convertToTemplate : convertToTemplate,
        templatizeRow: templatizeRow,
        onPatternValueChange : onPatternValueChange
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

      /* BEGIN : setRegexList */
      function setRegexList(scenariiKind, list){
        self.regexMap[scenariiKind] = list;
      }
      /* END : setRegexList */


      /* BEGIN : get action type or scenario type  */
      function getActionType(scenario, row){
        if(angular.isDefined(row.patterns) && row.patterns.startsWith("@service")){
          return "service";
        }
        else if (angular.isDefined(row.patterns) && row.patterns.startsWith("@web")){
          return "web";
        }
        else if (angular.isDefined(row.patterns) && row.patterns.startsWith("@swing")){
          return "swing";
        }
        else {
          return scenario.type || "web";
        }
      }
      /* END : get action type or scenario type  */


      /* BEGIN : convert scenario to template  */
      function convertToTemplate(scenario){
        var newScenariTemplatePromise = $q.defer();
        var newScenarioTemplate = scenario;
        for(var i = 0 ; i < newScenarioTemplate.rows.length ; i++){
          templatizeRow(newScenarioTemplate.rows[i], getActionType(newScenarioTemplate, newScenarioTemplate.rows[i]), null);
        }
        newScenarioTemplate.template = false;
        newScenariTemplatePromise.resolve(newScenarioTemplate);
        return newScenariTemplatePromise.promise;
      }
      /* END : converet scenario to template  */

      /* BEGIN : templatize one scenario row (or scentence)  */
      function templatizeRow(row, type, MapElementsIds){
        var actionType = type || 'swing';
        row.kind = actionType;
        var regexList = self.regexMap[actionType]; 
        var sentence = removeHeadAnnotation(row.patterns);
        for(var j=0; j < regexList.length; j++){
          var replacedSentence = ClientService.convertToRegexSentence(regexList[j].typed_sentence);
          var regex = new RegExp(replacedSentence, 'i');
          if(regex.test(sentence)){
            var typeSentence = regexList[j].typed_sentence;
            var pattern = ClientService.convertToPatternSentence(typeSentence);
            var scenarioRow = row;
            setMappingForScenarioRow(scenarioRow, pattern, typeSentence, MapElementsIds);
            break;
          }
        } 
      }
      /* END : templatize one scenario row (or scentence)  */

      /* BEGIN  : performs model update */
      function onPatternValueChange(row, position, identifier, data) {
        var newVal = {id: identifier, pos: position, value: data};
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
      /* END : performs model update */


      /* ----- local functions ------ */
      /* BEGIN  : setMappingForScenarioRow */
      function splitScenarioWithValues(scenarioSentenceWithValues){
        var splittedByAst  = scenarioSentenceWithValues.split("*");
        if(splittedByAst[0] === ""){
            splittedByAst.splice(0,1);
        }
        var splittedScenarioSentence = [];
        splittedByAst.forEach(function(element,index){
            if(index == 0 || index % 2 == 0){
                Array.prototype.push.apply(splittedScenarioSentence, element.split(" "));
            } else {
              splittedScenarioSentence.push(element);
            }
        });

        splittedScenarioSentence.forEach(function(element,index){
          if(element === ""){
            splittedScenarioSentence.splice(index,1);
          }
        });
        return splittedScenarioSentence;
      }

      function setMappingForScenarioRow(scenarioRow, pattern, typeSentence, MapElementsIds){
        var scenarioSentenceWithValues = scenarioRow.patterns;
        scenarioRow.patterns = typeSentence;
        var patternValue = typeSentence;
        var tag = getRegexTag(typeSentence);
        var tags = [];
        var tagPosition = 0;
        var componentPosition = 0;
        while (tag != null) {
          tags.push(tag);
          var tagName = tags[tagPosition][0];      
          var mappingValue = splitScenarioWithValues(scenarioSentenceWithValues)[getIndex(patternValue.split(" "), tagName)];
          patternValue = replaceIndex(patternValue, tagName,  tags[tagPosition].index , mappingValue);
          var varType = ClientService.actionItemType(tagName).category;
          if(MapElementsIds != null){
            if(varType == "component"){
                onPatternValueChange(scenarioRow, tagPosition, MapElementsIds[componentPosition], mappingValue);
                componentPosition = componentPosition + 1;
            }else{
               onPatternValueChange(scenarioRow, tagPosition, tagPosition.toString(), mappingValue);
            }
                
          } else {

            onPatternValueChange(scenarioRow, tagPosition, varType == "component" ? varType : tagPosition.toString(), mappingValue);
          }
          tagPosition = tagPosition + 1;
          tag = getRegexTag(patternValue);
        }
      }
      /* END  : setMappingForScenarioRow */

      /* BEGIN : remove head annotation */
      function removeHeadAnnotation(sentence){
        var regex = /(swing|web|service|driverLess):?([\w]*)? ([\w\W]+)/
        var tail;
        if(tail = regex.exec(sentence)){
          return tail[3];
        }
        return sentence;
      }
      /* END : remove head annotation */

      function getRegexTag(sentence){
        var tagRegex = /\{\{[\w:]+\}\}/gi;
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
     /* END : replaceIndex */

   }

 }
});