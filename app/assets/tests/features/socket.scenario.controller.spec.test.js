define(['angular','angular-mocks', 'scenarioCtrl','features','treeLayoutService'], function(angular,angularMocks, scenarioCtrl,features,treeLayoutService) {
    'use strict';
    describe('ScenarioCtrl', function() {
        console.log("---- Starting : socket ScenarioCtrl test ----");
        var $controller,
        scope,
        clientService,
        ws,
        injectedWs;
        
        function receiveMessage(message) {
            message.data = JSON.stringify(message.data);
            injectedWs.onmessage(message);
        };

        beforeEach(module('play.routing'));
        beforeEach(module('ui.bootstrap'));
        beforeEach(module('sidesplit'));
        beforeEach(module('app'));
        beforeEach(function(){
            module('tk.services', function ($provide) {
              injectedWs = {};    
              ws = function () {
                return injectedWs;
            };

            $provide.constant('webSocket', ws);
        });
            inject(function (_ClientService_) {
              clientService = _ClientService_;
          });
        });

        beforeEach(inject(function(_$controller_, $rootScope){
            $controller = _$controller_;
            scope = $rootScope.$new();
            $controller(scenarioCtrl.ScenarioCtrl, {$scope: scope});
        }));


        describe('Exact wxebsocket sentence templatisation', function() {
            it("should call subscribers when a message is received", function () {
               // scope.scenario = scope.scenarii[0];
               scope.recordActions();

               var callback = jasmine.createSpy('onMessage callback');

               function message() {
                return {
                    data: {
                        sentence:"Type *submit* in *LoginPage.login*",
                        ids:["570785763004fe60a012bf8f"]
                    }
                };
            }
            receiveMessage(message());
        });

        });
    });

});