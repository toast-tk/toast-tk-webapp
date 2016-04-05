/*require(['angular-mocks'], function(angularMocks) {*/
    'use strict';
describe('AddUserCtrl', function() {

    var $controller,
    displayParams,
    scope,
    DashListService;

    beforeEach(module('app'));

/*    beforeEach(inject(function(_AddUserService_){
      AddUserService = _AddUserService_ ;
  }));
*/
    beforeEach(inject(function(_$controller_, $rootScope){
        $controller = _$controller_;
        scope = $rootScope.$new();
        /*displayParams = AddUserService.initListDisplayParams() ;*/
        $controller('AddUserCtrl', {$scope: scope});
    }));

    describe('verify exact scope variable', function() {
        it('says hello world!', function () {
            expect(scope.greeting).toEqual("Hello world!");
        });
    });

});
/*
});*/