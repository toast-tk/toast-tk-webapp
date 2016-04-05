var tests = [];
for (var file in window.__karma__.files) {
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/test\.js$/.test(file)) {
    console.log("------  testingggg: file ")
      tests.push(file);
    }
  }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base/src',

    paths: {
        'angular': '../bower_components/angular/angular',
        'angular-mocks': '../bower_components/angular-mocks/angular-mocks'
/*        'jquery': '../lib/jquery',
        'underscore': '../lib/underscore',*/
    },

    shim: {
        'angular': { deps: ['jquery'], exports: 'angular'},
        'angular-mocks': {deps: ['angular'], 'exports': 'angular-mocks'}
/*        'underscore': {
            exports: '_'
        }*/
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});