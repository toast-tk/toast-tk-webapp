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
        'jquery': '../base/node_modules/jquery/dist/jquery',
        'requirejs': '../base/node_modules/requirejs/require',
        'angular': '../base/node_modules/angular/angular',
        'angular-mocks': '../base/node_modules/angular-mocks/angular-mocks',

        'addUserCtrl' : '../base/javascripts/admin/accounts/adduser.controller'
    },

    shim: {
        'jquery': { deps: [], exports: '$'},
        'requirejs': { deps: [], exports: 'requirejs'},
        
        'angular': { deps: ['jquery'], exports: 'angular'},
        'angular-mocks': {deps: ['angular'], 'exports': 'angular-mocks'},

        'addUserCtrl': {deps: ['angular'], exports: 'addUserCtrl'}
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});