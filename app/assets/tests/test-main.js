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
    paths: {
        'jquery': '../base/libs/jquery/dist/jquery',
        'requirejs': '../base/libs/requirejs/require',
        'angular': '../base/libs/angular/angular',
        'angular-mocks': '../base/libs/angular-mocks/angular-mocks',
        'jasmine-jquery': '../base/libs/jasmine-jquery/lib/jasmine-jquery',

        /*'jsRoutes' : '127.0.0.1:9000/jsroutes',*/
        'jsRoutes' : '../base/tests/jsroutes.test',
        /*'ngProgress' : '../base/bower_components/ngprogress/build/ngprogress.min',*/
        'ngProgress' : '../base/javascripts/libs/ngProgress.min',
        'playRoutes': '../base/javascripts/services/playRoutes',
        "sidesplit": '../base/javascripts/libs/angular-sidesplit.provider',
        "ui.bootstrap": ['../base/javascripts/libs/ui-bootstrap-tpls-0.12.1'],
        "features": ['../base/javascripts/main.app'],
        'clientService': "./javascripts/services/client-service",
        'scenarioCtrl': '../base/javascripts/features/scenario/scenario.controller',
        'addUserCtrl' : '../base/javascripts/admin/accounts/adduser.controller',
        "componentsDir" : '../base/javascripts/directives/components',
        "sortable": "../base/javascripts/libs/sortable",


        text : '../base/javascripts/libs/require-plugins/text',
        json : '../base/javascripts/libs/require-plugins/json',
        "jquery-ui" : "../base/libs/jquery-ui/jquery-ui",
        "angularRoute": "../base/libs/angular-route/angular-route.min",
        //"angularRoute1" : "../base/javascripts/libs/angular-ui-router.min",
          "ui-sortable" : ['../base/javascripts/libs/sortable'],
        "underscore" : "../base/libs/underscore/underscore-min",
        "qTags": ['../base/javascripts/libs/jquery-textntags'],
        "angular-ui-tree": ['../base/javascripts/libs/angular-ui-tree.min'],
        "angular-animate":['../base/javascripts/libs/angular-animate.min'],
        "bootstrap":['../base/javascripts/libs/bootstrap.min'],
        "xeditable": ['../base/javascripts/libs/xeditable'],
        "ui.router": ['../base/javascripts/libs/angular-ui-router.min'],
        "webix": ['../base/javascripts/libs/webix'],
        "angular-toastr": ['../base/javascripts/libs/angular-toastr.tpls.min'],
        "angucomplete": ['../base/javascripts/libs/angucomplete-alt.min'],
        "loginCtrl" : ['../base/javascripts/auth/login'],
        "loginService" : ['../base/javascripts/auth/login.service'],
        "loginResolverService" : ['../base/javascripts/auth/login.resolver.service'],
        "sidebarmenu": ['../base/javascripts/features/layout/sidebar.menu.controller'],
        "layout": ['../base/javascripts/features/layout/layout.controller'],
        "layoutService" :  ['../base/javascripts/features/layout/layout.service'],
        "treeLayoutService": ['../base/javascripts/features/layout/tree.layout.service'],
        "homeCtrl": ['../base/javascripts/features/home'],
        "SettingsCtrl" :  ['../base/javascripts/features/settings/settings.controller'],
        "newSettingsModalCtrl": ["../base/javascripts/features/settings/newSettings.modal.controller"],
        "RepositoryCtrl": ["../base/javascripts/features/repository/repository.controller"],
        "ScenarioCtrl": ["../base/javascripts/features/scenario/scenario.controller"],
        "CampaignCtrl": ["../base/javascripts/features/campaign/campaign.controller"],
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
        'features': { deps: ["angular", "playRoutes",  "routerConfig", "configConfig", "treeLayoutService" ,
            "loginCtrl", "loginService", "loginResolverService", "SettingsCtrl", "newSettingsModalCtrl", "RepositoryCtrl", "CampaignCtrl", "utilsScenarioService", 
            "homeCtrl",
            "sidebarmenu", "layout", "layoutService", "newObjectModalCtrl", "newStepService", "newStepModalCtrl", "json!javascripts/config/icon.constants.config.json",
            "adminLayoutCtrl", "adminSidebarmenu", "addUserCtrl",


            "clientService",
            "componentsDir", "sortable", "ngProgress", 
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