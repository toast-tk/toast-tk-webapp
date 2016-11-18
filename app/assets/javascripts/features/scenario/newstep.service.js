(function() {
  "use strict";

    angular.module("app").service("NewStepService", NewStepService);

    function NewStepService($q) {
      var self = this ;

      return {
        buildSelectedStep : buildSelectedStep,
        buildCustomStep: buildCustomStep
      }

      function buildSelectedStep(newStep, scenarioType){
             var promise = $q.defer();
             var isResolved ;                
             var step =  {};
             step.kind = scenarioType ;
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
                promise.resolve(newCustomStep);
                return promise;
      }

    }
    /* END : NewStepService function */

})();