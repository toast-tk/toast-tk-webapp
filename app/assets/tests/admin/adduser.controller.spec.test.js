define(['angular','angular-mocks', 'features', 'addUserCtrl'], function(angular,angularMocks,features, AddUserCtrl) {
    'use strict';
describe('AddUserCtrl', function() {
    console.log("---- Starting : AddUserCtrl test ----");
    var $controller, displayParams, scope, DashListService;

    beforeEach(module(function($provide) {
        $provide.constant('defaultProject', {
            name: 'default',
            id: 'project-id',
            description: 'project mock'
        });
    }));


    beforeEach(module('toastr'));
    beforeEach(module('play.routing'));
    beforeEach(inject(function(_$controller_, $rootScope){
        $controller = _$controller_;
        scope = $rootScope.$new();
        $controller(AddUserCtrl.AddUserCtrl, {$scope: scope});
    }));

    describe('verify exact scope variable', function() {
        it('initialise scope variables!', function () {
            expect(scope.isNewUserFormSubmitted).toEqual(false);
            expect(scope.newUser).toEqual({});
        });
    });

});

});