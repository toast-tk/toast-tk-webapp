define(['angular','angular-mocks', 'scenarioCtrl','features','treeLayoutService'], function(angular,angularMocks, scenarioCtrl,features,treeLayoutService) {
    'use strict';
    describe('ScenarioCtrl', function() {
        console.log("---- Starting : ScenarioCtrl test ----");
        var $controller,
        displayParams,
        scope,
        DashListService;

        beforeEach(module('play.routing'));
        beforeEach(module('ui.bootstrap'));
        beforeEach(module('sidesplit'));
        beforeEach(module('tk.services'));
        beforeEach(module('app'));

        beforeEach(inject(function(_$controller_, $rootScope){
            $controller = _$controller_;
            scope = $rootScope.$new();
            $controller(scenarioCtrl.ScenarioCtrl, {$scope: scope});
        }));

        describe('verify exact tempalate function', function() {
            it('verify exactitude', function () {
                scope.scenario = {
                    "id" : "56eae1756f94b87799b10369",
                    "name" : "web1",
                    "type" : "web",
                    "driver" : "web",
                    "rows" : "[{\"patterns\":\"Récupérer la valeur de {{component:swing}}\",\"kind\":\"swing\",\"mappings\":[{\"id\":\"56eadeaff500009f08f5bb98\",\"val\":\"object1.login\",\"pos\":0}]},{\"patterns\":\"\",\"kind\":\"web\",\"mappings\":[]},{\"patterns\":\"\",\"kind\":\"web\",\"mappings\":[]},{\"patterns\":\"\",\"kind\":\"web\",\"mappings\":[]},{\"patterns\":\"\",\"kind\":\"web\",\"mappings\":[]}]",
                    "parent" : "0"
                }

                scope.convertToTemplate(scope.scenario);

            });
        });

    });

});