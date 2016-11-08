var tests = [];

var pathToModule = function(path) {
    return path.replace(/^\/base\//, '').replace(/\.js$/, '');
};

for (var file in window.__karma__.files) {
  //console.log(file);
  if (window.__karma__.files.hasOwnProperty(file)) {
    if (/spec\.test\.js$/.test(file)) {
      tests.push(file);
    }
  }
}

requirejs.config({
    // Karma serves files from '/base'
    baseUrl: '/base',
    waitSeconds: 200,
    packages: [
    {
            name: 'CryptoJS',
            location: '../base/libs/crypto-js',
            main: 'index'
        }
    ],
    paths: {
        'jquery': '../base/libs/jquery/dist/jquery',
        "jquery-ui" : "../base/libs/jquery-ui/jquery-ui",
        "underscore" : "../base/libs/underscore/underscore-min",
        'requirejs': '../base/libs/requirejs/require',
        text : '../base/libs/requirejs-plugins/lib/text',
        json : '../base/libs/requirejs-plugins/src/json',
        "bootstrap":['../base/libs/bootstrap/dist/js/bootstrap.min'],
        
        'angular': '../base/libs/angular/angular',
        "angularRoute": "../base/libs/angular-route/angular-route.min",
        "ui.router": ['../base/libs/angular-ui-router/release/angular-ui-router.min'],
        "angular-animate":['../base/libs/angular-animate/angular-animate.min'],
        "ui-sortable" : ['../base/libs/angular-ui-sortable/sortable.min'],
        "angular-toastr": ['../base/libs/angular-toastr/dist/angular-toastr.tpls.min'],
        "angucomplete": ['../base/libs/angucomplete-alt/dist/angucomplete-alt.min'],
        "angular-ui-tree": ['../base/libs/angular-ui-tree/dist/angular-ui-tree.min'],
        "ui.bootstrap": ['../base/libs/angular-bootstrap/ui-bootstrap-tpls.min'],
        "ngProgress" : "../base/libs/ngprogress/build/ngProgress.min",
        "xeditable": ['../base/libs/angular-xeditable/dist/js/xeditable.min'],
        "jwtClient" : ['../base/libs/jwt-client/jwt-client'],
        
        'angular-mocks': '../base/libs/angular-mocks/angular-mocks',
        'jasmine-jquery': '../base/libs/jasmine-jquery/lib/jasmine-jquery',

        "qTags": ['../base/javascripts/libs/jquery-textntags'],
        "webix": ['../base/javascripts/libs/webix'],
        "sidesplit": '../base/javascripts/libs/angular-sidesplit.provider',
        "sortable": "../base/javascripts/libs/sortable",
        
        /*'jsRoutes' : '127.0.0.1:9000/jsroutes',*/
        'jsRoutes' : '../base/tests/jsroutes.test',

        'playRoutes': '../base/javascripts/services/playRoutes',
        "features": ['../base/javascripts/main.app'],
        'clientService': "./javascripts/services/client-service",
        'scenarioCtrl': '../base/javascripts/features/scenario/scenario.controller',
        'addUserCtrl' : '../base/javascripts/admin/accounts/adduser.controller',
        "componentsDir" : '../base/javascripts/directives/components',
        "loginCtrl" : ['../base/javascripts/auth/login'],
        "loginService" : ['../base/javascripts/auth/login.service'],
        "loginResolverService" : ['../base/javascripts/auth/login.resolver.service'],
        "sidebarmenu": ['../base/javascripts/features/layout/sidebar.menu.controller'],
        "layout": ['../base/javascripts/features/layout/layout.controller'],
        "layoutService" :  ['../base/javascripts/features/layout/layout.service'],
        "chartUtils" :  ['./javascripts/services/chart-utils'],
        "treeLayoutService": ['../base/javascripts/features/layout/tree.layout.service'],
        "homeCtrl": ['../base/javascripts/features/home'],
        "AskForAccountCtrl" : ['../base/javascripts/auth/askforaccount.controller'],
        "SettingsCtrl" :  ['../base/javascripts/features/settings/settings.controller'],
        "newSettingsModalCtrl": ["../base/javascripts/features/settings/newSettings.modal.controller"],
        "RepositoryCtrl": ["../base/javascripts/features/repository/repository.controller"],
        "ScenarioCtrl": ["../base/javascripts/features/scenario/scenario.controller"],
        "TestPlanCtrl": ["../base/javascripts/features/testplan/testplan.controller"],
        "TestPlanReportCtrl": ["../base/javascripts/features/testplan/testplan.report.controller"],
        "TestPlanSetupCtrl": ["../base/javascripts/features/testplan/testplan.setup.controller"],
        "utilsScenarioService" : ["../base/javascripts/features/scenario/utils.scenario.service"],
        "newStepService": ["../base/javascripts/features/scenario/newstep.service"],
        "newStepModalCtrl": ["../base/javascripts/features/scenario/newstep.modal.controller"],
        "newObjectModalCtrl": ["../base/javascripts/features/repository/newobject.modal.controller"],
        "routerConfig": ["../base/javascripts/main.routes"],
        "configConfig": ["../base/javascripts/main.config"],
        "adminLayoutCtrl" :  ["../base/javascripts/admin/layout/layout.controller"],
        "adminSidebarmenu": ['../base/javascripts/admin/layout/sidebar.menu.controller'],
        "addUserCtrl" : ["../base/javascripts/admin/accounts/adduser.controller"],
        "IconsJsonFile" :"json!javascripts/config/icon.constants.config.json"

    },

    shim: {
/*        'jquery': { deps: [], exports: '$'},
*/        'requirejs': { deps: [], exports: 'requirejs'},
        
/*        'angular': { deps: ['jquery'], exports: 'angular'},
*/        'angular-mocks': {deps: ['angular'], 'exports': 'angular-mocks'},
          'jasmine-jquery': {deps: ['jquery'], 'exports': 'jasmine-jquery'},


         'jsRoutes': {
        deps: ['angular'],
        exports: 'jsRoutes'
      },
      'angular': {
        deps: ['jquery', 'qTags'],
        exports: 'angular'
      },
      'qTags': {
        deps: ['jquery', 'underscore'],
        exports: 'qTags'
      },
      'jquery': {
        deps: [],
        exports: '$'
      },
      'underscore': {
        deps: [],
        exports: '_'
      },
      'angular-ui-tree':{
        deps: ['angular']
      },
      'jquery-ui':{
        deps: ['jquery']
      },
      'angularRoute': ['angular'],
      'ui.router':{
        deps: ['angular']
      },
      'ngProgress': {
        deps: ['angular'],
        exports: 'ngProgress'
      },
      'xeditable': {
        deps: ['angular']
      },
      'angular-toastr':  ['angular'],
      'sidesplit':{
        deps: ['angular']
      },
      'angular-animate':{
        deps: ['angular']
      },
      'bootstrap': {
        deps: ['jquery']
      },
      'ui.bootstrap': {
        deps: ['angular','bootstrap']
      },
      'webix':{
        deps: ['angular']
      },
      'angucomplete':{
        deps: ['angular']
      },
      'sidebarmenu':{
        deps: ['angular']
      },




/*        'angularRoute': ['angular'],
              'angular-animate':{
        deps: ['angular']
      },
            'angular-toastr':  ['angular'],
      'qTags': {
        deps: ['jquery', 'underscore'],
        exports: 'qTags'
      },

        'jsRoutes': {deps: ['angular'], exports: 'jsRoutes'},
        'ngProgress': {deps: ['angular'], exports: 'ngProgress'},
        'playRoutes': {deps: ['angular','jsRoutes','ngProgress'], exports: 'playRoutes'},
        'sidesplit':{ deps: ['angular'], exports: 'sidesplit'},
         'bootstrap': {
        deps: ['jquery']
      },
        'ui.bootstrap': { deps: ['angular','bootstrap'], exports: 'ui.bootstrap' },*/
        'features': { deps: ["angular", "playRoutes",  "routerConfig", "configConfig", "treeLayoutService" , "AskForAccountCtrl",
            "loginCtrl", "loginService", "loginResolverService", "SettingsCtrl", "newSettingsModalCtrl", "RepositoryCtrl", 
            "TestPlanCtrl", "TestPlanReportCtrl","TestPlanSetupCtrl", "utilsScenarioService", 
            "homeCtrl",
            "sidebarmenu", "layout", "layoutService", "newObjectModalCtrl", "newStepService", "newStepModalCtrl", "json!javascripts/config/icon.constants.config.json",
            "adminLayoutCtrl", "adminSidebarmenu", "addUserCtrl",


            "clientService", "chartUtils",
            "componentsDir", "sortable", "ngProgress", "jwtClient",
            "angular-ui-tree", "bootstrap", "ui.bootstrap", "angularRoute", "angucomplete",
            "xeditable", "ui.router", "angular-animate", "sidesplit", "angular-toastr", "webix"], exports: 'features' },

        'clientService' : {deps: ['angular'], exports: 'clientService'},
        'scenarioCtrl': {deps: ['angular'], exports: 'scenarioCtrl'},
        'addUserCtrl': {deps: ['angular'], exports: 'addUserCtrl'}
    },

    // ask Require.js to load these files (all our tests)
    deps: tests,

    // start test run, once Require.js is done
    callback: window.__karma__.start
});