// Karma configuration
// Generated on Tue Apr 05 2016 09:02:29 GMT+0200 (Paris, Madrid (heure d’été))

module.exports = function(config) {
  var configuration = {

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',
    //browserNoActivityTimeout: 100000,

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],

    plugins: [
      "karma-chrome-launcher",
      "karma-jasmine",
      "karma-coverage",
      "karma-ng-html2js-preprocessor"
    ],

    // list of files / patterns to load in the browse
    // {pattern: 'libs/**/**.min.js',  watch: false}
    //{pattern: 'libs/**/**/**.min.js',  watch: false},
    files: [
        {pattern: 'libs/jquery/dist/jquery.js', watch: false},
        {pattern: 'libs/jquery-ui/jquery-ui.js',  watch: false},
        {pattern: 'libs/underscore/underscore-min.js',  watch: false},
        {pattern: 'libs/crypto-js/crypto-js.js',  watch: false},
        {pattern: 'libs/bootstrap/dist/js/bootstrap.min.js',  watch: false},
        {pattern: 'libs/angular/angular.js',  watch: false, included: true},
        {pattern: 'libs/angular-route/angular-route.min.js',  watch: false},
        {pattern: 'libs/angular-ui-router/release/angular-ui-router.js',  watch: false},
        {pattern: 'libs/angular-animate/angular-animate.min.js',  watch: false},
        {pattern: 'libs/angular-ui-sortable/sortable.min.js',  watch: false},
        {pattern: 'libs/angular-messages/angular-messages.js',  watch: false},
        {pattern: 'libs/angular-toastr/dist/angular-toastr.tpls.min.js',  watch: false},
        {pattern: 'libs/angucomplete-alt/dist/angucomplete-alt.min.js',  watch: false},
        {pattern: 'libs/angular-ui-tree/dist/angular-ui-tree.min.js',  watch: false},
        {pattern: 'libs/angular-bootstrap-lightbox/dist/angular-bootstrap-lightbox.min.js',  watch: false},
        {pattern: 'libs/angular-bootstrap/ui-bootstrap-tpls.min.js',  watch: false},
        {pattern: 'libs/ngprogress/build/ngProgress.min.js',  watch: false},
        {pattern: 'libs/angular-xeditable/dist/js/xeditable.min.js',  watch: false},
        {pattern: 'libs/jwt-client/jwt-client.js',  watch: false},
        {pattern: 'libs/ng-tags-input/ng-tags-input.min.js',  watch: false},
        {pattern: 'libs/angularjs-dropdown-multiselect/src/angularjs-dropdown-multiselect.js',  watch: false},
        {pattern: 'libs/chart.js/dist/Chart.min.js',  watch: false},
        {pattern: 'libs/angular-chart.js/dist/angular-chart.min.js', watch: false},
        {pattern: 'libs/angular-resizable/src/angular-resizable.js', watch: false},
        {pattern: 'libs/angular-mocks/angular-mocks.js',  watch: true},
        {pattern: 'libs/jasmine-jquery/lib/jasmine-jquery.js',  watch: false},
        {pattern: 'javascripts/main.js', included: true},
        {pattern: 'javascripts/main.config.js', included: true},
        {pattern: 'javascripts/main.routes.js', included: true},
        {pattern: 'javascripts/config/icon.constants.config.js', watched: true, included: false, served: true},
        {pattern: 'javascripts/**/*.js', included: true},
        {pattern: 'javascripts/**/**/*.js', included: true},
        {pattern: 'html/login.html', watched: false, included: true, served: true},
        {pattern: 'mocks/*.json', watched: true, served: true, included: false},
        'tests/*test.js',
        'tests/**/*test.js'

    ],

    proxies: {
      'html/login.html': '../../public/html/login.html'
    },

    // list of files to exclude
    exclude: [
        //'javascripts/main.js'
    ],

    customLaunchers: {
        Chrome_travis_ci: {
            base: 'Chrome',
            flags: ['--no-sandbox']
        }
    },

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
        "../../public/html/**/*.html": ["ng-html2js"],
        "javascripts/**/*.js": ["coverage"]
    },

    ngHtml2JsPreprocessor: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
      reporters: ["progress", "coverage"],
      coverageReporter: {
          dir: "build/reports/coverage",
          reporters: [
              // reporters not supporting the `file` property
              { type: "lcov", subdir: "report-lcov" }
          ]
      },

    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    /*browsers: ['Chrome', 'Firefox'],*/
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  }

  if (process.env.TRAVIS) {
    configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration)
}
