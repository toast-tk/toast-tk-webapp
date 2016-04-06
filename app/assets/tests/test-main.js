var tests = [];

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/spec\.test\.js$/.test(file)) {
    console.log("------  testingggg: file ", file)
      tests.push(file);
    }
  }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base',

    paths: {
        'domReady': '../base/node_modules/domready/ready.min',
        'jquery': '../base/node_modules/jquery/dist/jquery',
        'requirejs': '../base/node_modules/requirejs/require',
        'angular': '../base/node_modules/angular/angular',
        'angular-mocks': '../base/node_modules/angular-mocks/angular-mocks',

        'main' :["../base/javascripts/main", "../base/javascripts/main.routes", "../base/javascripts/main.config"],
        'addUserCtrl' : '../base/javascripts/admin/accounts/adduser.controller'
    },

    shim: {
        'domReady': { deps: [], exports: 'domReady'},
        'jquery': { deps: [], exports: '$'},
        'requirejs': { deps: [], exports: 'requirejs'},
        
        'angular': { deps: ['jquery'], exports: 'angular'},
        'angular-mocks': {deps: ['angular'], 'exports': 'angular-mocks'},

        'main' : {deps: ['angular'], exports: 'main'},
        'addUserCtrl': {deps: ['angular'], exports: 'addUserCtrl'}
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});

/*var tests = [];
for (var file in window.__karma__.files) {
    if (/\.test\.js$/.test(file)) {
           console.log("------  testingggg: file ", file);
        tests.push(file);
    }
}

requirejs.config({
    baseUrl: '/base',

    deps: tests,

    callback: window.__karma__.start
});*/