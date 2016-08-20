(function() {
  "use strict";

  requirejs.config({
      packages: [
          {
              name: 'CryptoJS',
              location: '../libs/crypto-js',
              main: 'index'
          }
      ],
    shim: {
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
      'jwtClient': {
        deps: [],
        exports: 'jwtClient'
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
      'ngTagsInput':{
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
      }
    },
    paths: {
        'jquery': '../libs/jquery/dist/jquery',
        "jquery-ui" : "../libs/jquery-ui/jquery-ui",
        "underscore" : "../libs/underscore/underscore-min",
        'requirejs': '../libs/requirejs/require',
        text : '../libs/requirejs-plugins/lib/text',
        json : '../libs/requirejs-plugins/src/json',
        "bootstrap":['../libs/bootstrap/dist/js/bootstrap.min'],
        
        'angular': '../libs/angular/angular',
        "angularRoute": "../libs/angular-route/angular-route.min",
        "ui.router": ['../libs/angular-ui-router/release/angular-ui-router.min'],
        "angular-animate":['../libs/angular-animate/angular-animate.min'],
        "ui-sortable" : ['../libs/angular-ui-sortable/sortable.min'],
        "angular-toastr": ['../libs/angular-toastr/dist/angular-toastr.tpls.min'],
        "angucomplete": ['../libs/angucomplete-alt/dist/angucomplete-alt.min'],
        "angular-ui-tree": ['../libs/angular-ui-tree/dist/angular-ui-tree.min'],
        "ui.bootstrap": ['../libs/angular-bootstrap/ui-bootstrap-tpls.min'],
        "ngProgress" : "../libs/ngprogress/build/ngProgress.min",
        "xeditable": ['../libs/angular-xeditable/dist/js/xeditable.min'],
        "jwtClient" : ['../libs/jwt-client/jwt-client'],
        "ngTagsInput" : ["../libs/ng-tags-input/ng-tags-input.min"],

        "qTags": ['./libs/jquery-textntags'],
        "webix": ['libs/webix'],
        "sidesplit": ['libs/angular-sidesplit.provider'],

        'jsRoutes': ['/jsroutes'],

        'playRoutes': './services/playRoutes',
        'clientService': "./services/client-service",
        "componentsDir" : './directives/components',
        "sortable": "./libs/sortable",
        "homeCtrl": ['./features/home'],
        "loginCtrl" : ['auth/login'],
        "loginService" : ['auth/login.service'],
        "loginResolverService" : ['auth/login.resolver.service'],
        "sidebarmenu": ['features/layout/sidebar.menu.controller'],
        "layout": ['features/layout/layout.controller'],
        "layoutService" :  ['features/layout/layout.service'],
        "treeLayoutService": ['./features/layout/tree.layout.service'],
        "SettingsCtrl" :  ['features/settings/settings.controller'],
        "newSettingsModalCtrl": ["./features/settings/newSettings.modal.controller"],
        "RepositoryCtrl": ["./features/repository/repository.controller"],
        "ScenarioCtrl": ["./features/scenario/scenario.controller"],
        "CampaignCtrl": ["./features/campaign/campaign.controller"],
        "utilsScenarioService" : ["./features/scenario/utils.scenario.service"],
        "newStepService": ["./features/scenario/newstep.service"],
        "newStepModalCtrl": ["./features/scenario/newstep.modal.controller"],
        "newObjectModalCtrl": ["./features/repository/newobject.modal.controller"],
        "routerConfig": ["./main.routes"],
        "configConfig": ["./main.config"],
        "adminLayoutCtrl" :  ["./admin/layout/layout.controller"],
        "adminSidebarmenu": ['./admin/layout/sidebar.menu.controller'],
        "addUserCtrl" : ["./admin/accounts/adduser.controller"],
        "editUserCtrl" : ["./admin/accounts/edituser.controller"],
        "editUsersCtrl" : ["./admin/accounts/editusers.controller"],
        "validatorDirective" : ["./admin/accounts/validator.directive"],
        "addTeamCtrl" : ["./admin/teams/addteam.controller"],
        "editTeamCtrl" : ["./admin/teams/editteam.controller"],
        "addProjectCtrl" : ["./admin/projects/addproject.controller"],
        "editProjectCtrl" : ["./admin/projects/editproject.controller"],
        "editProjectsCtrl" : ["./admin/projects/editprojects.controller"]
    }
  });

  require(["angular", "playRoutes",  "routerConfig", "configConfig", "treeLayoutService" ,
            "loginCtrl", "loginService", "loginResolverService", "SettingsCtrl", "newSettingsModalCtrl", "RepositoryCtrl", "ScenarioCtrl", "CampaignCtrl", "utilsScenarioService", 
            "homeCtrl",
            "sidebarmenu", "layout", "layoutService", "newObjectModalCtrl", "newStepService", "newStepModalCtrl", "json!config/icon.constants.config.json",
            "adminLayoutCtrl", "adminSidebarmenu", "addUserCtrl", "editUsersCtrl", "validatorDirective", "addTeamCtrl", "editTeamCtrl", "editUserCtrl",
            "addProjectCtrl", "editProjectCtrl", "editProjectsCtrl",

            "clientService",
            "componentsDir", "sortable", "ngProgress", 
            "angular-ui-tree", "bootstrap", "ui.bootstrap", "angularRoute", "angucomplete",
            "xeditable", "ui.router", "angular-animate", "sidesplit", "angular-toastr", "webix", "jwtClient", "ngTagsInput"],
          function(a, b, routerConfig, configConfig, treeLayoutService,
                   login, loginService, loginResolverService, settingsCtrl,
                   newSettingsModalCtrl, repository, scenario, campaign,
                   utilsScenarioService, home, sidebarmenu, layout, layoutService,
                   newObjectModalCtrl, newStepService, newStepModalCtrl, constantsFile,
                   adminLayoutCtrl, adminSidebarmenu,
                   addUserCtrl, editUsersCtrl, validatorDirective,
                   addTeamCtrl, editTeamCtrl, editUserCtrl,
                   addProjectCtrl, editProjectCtrl, editProjectsCtrl
          ) {

              var app = angular.module("app", 
                ['ui.router', "play.routing", "ngAnimate",
                "tk.components", "tk.services",
                "ui.sortable", "ngProgress", "ui.tree", "ui.bootstrap", "xeditable", "sidesplit", "webix","angucomplete-alt","toastr","ngTagsInput"]);
              
              app.controller("LoginCtrl", login.LoginCtrl);
              app.controller("MainCtrl", home.MainCtrl);

              app.controller("ScenarioCtrl", scenario.ScenarioCtrl);
              
              app.controller("SettingsCtrl", settingsCtrl.SettingsCtrl);
              app.controller("NewSettingsModalCtrl", newSettingsModalCtrl.NewSettingsModalCtrl);
              
              app.controller("RepositoryCtrl", repository.RepositoryCtrl);

              app.controller("CampaignCtrl", campaign.CampaignCtrl);
              
              app.controller("SidebarMenuCtrl", sidebarmenu.SidebarMenuCtrl);
              app.controller("LayoutCtrl", layout.LayoutCtrl);
              
              app.controller("newObjectModalCtrl", newObjectModalCtrl.newObjectModalCtrl);
              app.service("UtilsScenarioService", utilsScenarioService.UtilsScenarioService); 
              app.service("NewStepService", newStepService.NewStepService); 
              
              app.controller("newStepModalCtrl", newStepModalCtrl.newStepModalCtrl);

              app.service("LoginService", loginService.LoginService);
              app.service("LoginResolverService", loginResolverService.ResolversService);

              app.service("LayoutService", layoutService.LayoutService);
              app.service("TreeLayoutService", treeLayoutService.TreeLayoutService);
              app.constant("ICONS", constantsFile);

              /* admin */
              app.controller("AdminLayoutCtrl", adminLayoutCtrl.AdminLayoutCtrl);
              app.controller("AdminSidebarMenuCtrl", adminSidebarmenu.AdminSidebarMenuCtrl);

              app.controller("AddUserCtrl", addUserCtrl.AddUserCtrl);
              app.controller("EditUserCtrl", editUserCtrl.EditUserCtrl);
              app.controller("EditUsersCtrl", editUsersCtrl.EditUsersCtrl);

              app.directive("login", validatorDirective.Login);
              app.directive("email", validatorDirective.Email);

              app.controller("AddTeamCtrl", addTeamCtrl.AddTeamCtrl);
              app.controller("EditTeamCtrl", editTeamCtrl.EditTeamCtrl);

              app.controller("AddProjectCtrl", addProjectCtrl.AddProjectCtrl);
              app.controller("EditProjectCtrl", editProjectCtrl.EditProjectCtrl);
              app.controller("EditProjectsCtrl", editProjectsCtrl.EditProjectsCtrl);
              
              app.config(routerConfig.RouterConfig);
              app.config(configConfig.ConfigConfig);

              app.run(function(editableOptions) {
                editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
                editableOptions.mode = 'popup';
              });

              angular.bootstrap(document, ["app"]);
          });
})();