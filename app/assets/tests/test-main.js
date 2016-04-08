var tests = [];

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/spec\.test\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base',

    paths: {
        'jquery': '../base/libs/jquery/dist/jquery',
        'requirejs': '../base/libs/requirejs/require',
        'angular': '../base/libs/angular/angular',
        'angular-mocks': '../base/libs/angular-mocks/angular-mocks',

        'jsRoutes' : '127.0.0.1:9000/jsroutes',
        'ngProgress' : '../base/javascripts/libs/ngProgress.min',
        'playRoutes': '../base/javascripts/services/playRoutes',
        'scenarioCtrl': '../base/javascripts/features/scenario/scenario.controller',
        'addUserCtrl' : '../base/javascripts/admin/accounts/adduser.controller'
    },

    shim: {
        'jquery': { deps: [], exports: '$'},
        'requirejs': { deps: [], exports: 'requirejs'},
        
        'angular': { deps: ['jquery'], exports: 'angular'},
        'angular-mocks': {deps: ['angular'], 'exports': 'angular-mocks'},

        'jsRoutes': {deps: ['angular'], exports: 'jsRoutes'},
        'ngProgress': {deps: ['angular'], exports: 'ngProgress'},
        'playRoutes': {deps: ['angular'], exports: 'playRoutes'},
        'scenarioCtrl': {deps: ['angular','playRoutes'], exports: 'scenarioCtrl'},
        'addUserCtrl': {deps: ['angular'], exports: 'addUserCtrl'}
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});