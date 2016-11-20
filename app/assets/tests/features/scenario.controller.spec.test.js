(function(angular,angularMocks, scenarioCtrl,features,treeLayoutService) {
    'use strict';
    describe('ScenarioCtrl', function() {
        console.log("---- Starting : ScenarioCtrl test ----");
        var $controller, $httpBackend, displayParams, scope, sentSaveScenarioData;

        jasmine.getJSONFixtures().fixturesPath='base/mocks';
        var untemplatedScenario = getJSONFixture("untemplatedScenario.json");
        var typeDescriptor = getJSONFixture("typeDescriptor.json");
        var CtxSentences  = getJSONFixture("ctxSentences.json");

        beforeEach(module(function($provide) {
            $provide.constant('defaultProject', {
                name: 'default',
                id: 'project-id',
                description: 'project mock'
            });
        }));
        beforeEach(module('play.routing'));
        beforeEach(module('ui.bootstrap'));
        beforeEach(module('sidesplit'));
        beforeEach(module('tk.services'));
        beforeEach(module('app'));

        beforeEach(inject(function(_$controller_, _$httpBackend_ , $rootScope){
            $controller = _$controller_;
            scope = $rootScope.$new();
            $httpBackend = _$httpBackend_;

            angular.forEach(["swing","service","web"],function(type){
                $httpBackend.when("GET", "/loadCtxSentences/"+ type).respond(CtxSentences[type]);   
            })
            $httpBackend.when("GET", "/agent/null").respond([{isAlive: true, host: "localhost", token:"api-token"}]);
            $httpBackend.when("GET", "/typeDescriptor").respond(typeDescriptor);
            $httpBackend.when("GET", "assets/html/login.html").respond("<html></html>");
            $httpBackend.when("GET", "/loadScenarii").respond([untemplatedScenario]);
            $httpBackend.whenPOST('/saveScenarii').respond(function(method, url, data, headers) {
                sentSaveScenarioData = JSON.parse(data) ;
                return [200, "ok"];
            });
            $controller(scenarioCtrl.ScenarioCtrl, {$scope: scope});
        }));

        describe('Exact template function templatisation', function() {
            it('verify that scenario rows are converted to Array', function () {
                $httpBackend.flush();
                angular.forEach(scope.scenarii,function(scenario){
                    var areRowsConvertedToArray = false ;
                    if(angular.isArray(scenario.rows)){
                        areRowsConvertedToArray = true;
                    }
                    expect(areRowsConvertedToArray).toBeTruthy();
                });
            });

            it('verify that scenario is converted and saved', function () {
                $httpBackend.flush();
                angular.forEach(scope.scenarii,function(scenario){
                    scope.convertToTemplate(scenario);
                    $httpBackend.expectPOST('/saveScenarii').respond()
                    expect(sentSaveScenarioData.rows.length).toBeDefined();
                });
            });
        });

    });

})();