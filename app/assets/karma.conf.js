// Karma configuration
// Generated on Tue Apr 05 2016 09:02:29 GMT+0200 (Paris, Madrid (heure d’été))

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine', 'requirejs'],
    
    plugins: [
      "karma-chrome-launcher",
      "karma-jasmine",
      "karma-requirejs"
    ],

    // list of files / patterns to load in the browser
    files: [
     {pattern:  'libs/jquery/dist/jquery.js', watch: false, included: false},
     {pattern: 'libs/angular/angular.min.js',  watch: false, included: false},
     {pattern: 'libs/angular-mocks/*.js',  watch: false, included: false},
     {pattern: 'libs/**/*.js',  watch: false, included: false},
      
      {pattern: 'javascripts/main.js', included: false},
      {pattern: 'javascripts/*.js', included: false},
      {pattern: 'javascripts/**/*.js', included: false},
      {pattern: 'javascripts/**/**/*.js', included: false},

      {pattern: 'tests/*test.js', included: false},
      {pattern: 'tests/**/*test.js', included: false},
      'tests/test-main.js'
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


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
  })
}
