define(['angular','angular-mocks','jquery', 'requirejs', 'addUserCtrl'], function(angular,angularMocks,$, requirejs, AddUserCtrl) {
    'use strict';
describe('AddUserCtrl', function() {
    console.log("herllo its test");
    var $controller,
    displayParams,
    scope,
    DashListService;

    beforeEach(inject(function(_$controller_, $rootScope){
        $controller = _$controller_;
        scope = $rootScope.$new();
        $controller(AddUserCtrl.AddUserCtrl, {$scope: scope});
    }));

    describe('verify exact scope variable', function() {
        it('says hello world!', function () {
            expect(scope.greeting).toEqual("Hello World!");
        });
    });

});

});