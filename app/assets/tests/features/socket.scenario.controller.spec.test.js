(function() {
    'use strict';
    describe('ScenarioCtrl', function() {
        console.log("---- Starting : socket ScenarioCtrl test ----");
        var $controller, $httpBackend, scope, clientService, UtilsScenarioService, ws, injectedWs;
    
        jasmine.getJSONFixtures().fixturesPath='base/mocks';
        var scenario = getJSONFixture("templatedScenario.json");
        var typeDescriptor = getJSONFixture("typeDescriptor.json");
        var CtxSentences  = getJSONFixture("ctxSentences.json");


        function receiveMessage(message) {
          injectedWs.onmessage(message);
        };

        beforeEach(module(function($provide) {
            $provide.constant('defaultProject', {
                name: 'default',
                id: 'project-id',
                description: 'project mock'
            });
        }));

       // beforeEach(module('play.routing'));
        //beforeEach(module('ui.bootstrap'));
        //beforeEach(module('sidesplit'));
        beforeEach(module('app'));
        
        beforeEach(function(){
            module('tk.services', function ($provide) {
                injectedWs = {fake:true};    
                ws = function () {
                    return injectedWs;
                };
                $provide.constant('webSocket', ws);
            });
            inject(function (_ClientService_,_UtilsScenarioService_) {
              clientService = _ClientService_;
              UtilsScenarioService = _UtilsScenarioService_;
            });
        });

        beforeEach(inject(function(_$controller_, _$httpBackend_ , $rootScope){
            $httpBackend = _$httpBackend_;
            $controller = _$controller_;
            $httpBackend.when("GET", "/typeDescriptor").respond(typeDescriptor);
            $httpBackend.when("GET", "assets/html/login.html").respond("<html></html>");
            $httpBackend.when("GET", "/agent/null").respond([{isAlive: true, host: "localhost", token:"api-token"}]);
            scope = $rootScope.$new();
            $controller('ScenarioCtrl', {$scope: scope});
            clientService.opensocket("api-token");
        }));


        describe('Exact websocket sentence templatisation', function() {
          it("should call subscribers when a message is received", function () {
             // scope.scenario = scope.scenarii[0];
             function concatSentencesRow(connectorConfigGroups, scenariiKind){
                  var list = [];
                     for(var j = 0; j< connectorConfigGroups.length; j++){
                      for (var k=0; k< connectorConfigGroups[j].rows.length; k++){
                          var connectorConfig = connectorConfigGroups[j].rows;
                          if(connectorConfig[k].type == scenariiKind){
                              list = list.concat( connectorConfig[k].syntax || []);
                          }
                      }
                  }
                  return list;
             }

             scope.scenario = scenario ;
             clientService.typeDescriptor = typeDescriptor || [];
             UtilsScenarioService.setRegexList("swing",concatSentencesRow(CtxSentences.swing,"swing"));
             UtilsScenarioService.setRegexList("web",concatSentencesRow(CtxSentences.web, "swing"));
             UtilsScenarioService.setRegexList("service",concatSentencesRow(CtxSentences.service, "swing"));
             //scope.recordActions();

              var callback = jasmine.createSpy('onMessage callback');

              function message() {
                  return {
                      data: 'sentence: {"sentence":"Type *submit* in *LoginPage.login*", "ids":["570280c33584d34f0eabf93a"]}'
                  };
              }
              console.log("test messge", message().data);
              receiveMessage(message());
          });
        });
      });

})();