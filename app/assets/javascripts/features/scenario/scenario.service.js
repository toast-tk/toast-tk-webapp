(function() {
    "use strict";

    angular.module("app").service("ScenarioService", ScenarioService);

    function ScenarioService($q, playRoutes) {
        var self = this ;
        return {
            loadScenarii : loadScenarii,
            saveScenarii: saveScenarii,
            deleteScenarii: deleteScenarii
        };

        /* BEGIN : loadScenarii */
        function loadScenarii(defaultProjectId){
            var loadPromise = $q.defer();
            playRoutes.controllers.ScenarioController.loadScenarii(defaultProjectId).get().then(function (response) {
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

                loadPromise.resolve(data);
            });

            return loadPromise.promise;
        }
        /* END : loadScenarii */

        function saveScenarii(scenarioCopy) {
            return playRoutes.controllers.ScenarioController.saveScenarii().post(scenarioCopy);
        }

        function deleteScenarii(scenarioid){
            return playRoutes.controllers.ScenarioController.deleteScenarii().post(angular.toJson(scenarioid));
        }

    }

})();