define(["angular"], function(angular) {
  "use strict";
  return {
	  ConfigurationCtrl: function($rootScope, $scope, playRoutes, ngProgress){
		  $scope.config_group_types = ["service", "entity"];
		  $scope.service_config_types = ["web", "swing", "backend"];
		  $scope.selectedConfig = undefined;
		  $scope.selectedConfigGroupType = "";
		  $scope.selectedConfigType = "";
		  $scope.configurations = [];

		  playRoutes.controllers.Application.loadConfiguration().get().then(function(response){
			  $scope.configurations = response.data || [];
			  //ngProgress.complete();
		  });

		  $scope.addNewSentence = function(newSentence, sentenceWithTypes){
			  $scope.selectedConfig.syntax.push({sentence: newSentence, typed_sentence: sentenceWithTypes});
		  };

		  $scope.deleteSentenceLine = function(newSentence){
			  $scope.selectedConfig.syntax.splice($scope.selectedConfig.syntax.indexOf(newSentence),1);
		  };

		  $scope.saveConfig = function(){
			  playRoutes.controllers.Application.saveConfiguration().post($scope.configurations).then(function(response){
				  //ngProgress.complete();
			  });
		  };

		  $scope.addConfigBlock = function(){
			  $scope.configurations.push({type: $scope.selectedConfigGroupType, rows: []});
		  };

		  $scope.editConfigLine = function(config, item){
			  $scope.selectedConfig = config;
		  };

		  $scope.deleteConfigLine = function(config, item){
			  config.rows.splice(config.rows.indexOf(item), 1);
		  };

		  $scope.addConfigLine = function(config, item){
			  //TODO: check which type is used here, type isn't persisted, it's probably an issue on server side
			  config.rows.push({type: $scope.selectedConfigType, name: item, syntax: []});
		  };

	  },
	  RepositoryCtrl: function($rootScope, $scope, playRoutes, ngProgress){
		  $scope.run_config_types = ["web page", "configure entity", "swing page"];
		  $scope.autosetups = [];
		  $scope.newAutoSetupRow = {};
		  $scope.selectedAutoSetupConfigType = "";
		  $scope.autoSetupConfigFilter = "";
		  $scope.autosetups = [];

		  playRoutes.controllers.Application.loadAutoConfiguration().get().then(function(response){
			  //convert autosetup rows into json
			  var autosetups = response.data.map(function(obj){
				  obj.rows = angular.isObject(obj.rows) ? obj.rows : JSON.parse(obj.rows);
				  return obj;
			  });
			  $scope.autosetups = autosetups || [];
			  //ngProgress.complete();
		  });


		  $scope.addAutoSetupConfig = function(){
			  playRoutes.controllers.Application.loadAutoSetupCtx($scope.selectedAutoSetupConfigType).get().then(function(response){
				  var autoSetupDescriptor = response.data;
				  $scope.autosetups.push({type: $scope.selectedAutoSetupConfigType,
					  columns: autoSetupDescriptor,
					  rows: []});
			  });
		  };

		  $scope.isArray = function(arr){
			  return angular.isArray(arr) ? "array" : "";
		  }

		  //

		  $scope.saveAutoConfig = function(){
			  var deepCopy = angular.copy($scope.autosetups);
			  deepCopy = deepCopy.map(function(autoSetup){
				  delete autoSetup.columns;
				  return autoSetup;
			  });
			  playRoutes.controllers.Application.saveAutoConfig().post(deepCopy).then(function(response){
				  //ngProgress.complete();
			  });
		  };

		  $scope.deleteRow = function(row, autosetup){
			  autosetup.rows.splice(autosetup.rows.indexOf(row), 1);
		  }

		  $scope.addAutoSetupRow = function(autosetup, newRow){
			  autosetup.rows.push(newRow);
			  $scope.newAutoSetupRow = {};
		  };
	  },
	  ScenarioCtrl: function($rootScope, $scope, playRoutes, ngProgress){
		  $scope.newRow = {};
		  $scope.scenario_types = [];
		  $scope.selectedType = "";
		  $scope.importModes = ["prepend", "append"];
		  $scope.scenarii = [];

		  playRoutes.controllers.Application.loadScenarii().get().then(function(response) {
			  var data = response.data || [];
			  data.map(function(scenario){
				  scenario.rows = angular.isObject(scenario.rows) ? scenario.rows : JSON.parse(scenario.rows);
				  return scenario;
			  });
			  $scope.scenarii = data;
			  //ngProgress.complete();
		  });

		  playRoutes.controllers.Application.loadConfiguration().get().then(function(response){
			  $scope.configurations = response.data || [];
			  for(var i =0; i< $scope.configurations.length; i++){
				  for(var j=0; j< $scope.configurations[i].rows.length; j++){
					  $scope.scenario_types.push({name: $scope.configurations[i].rows[j].name,
						  type: $scope.configurations[i].rows[j].type});
				  }
			  }
			  //ngProgress.complete();
		  });

		  $scope.add = function(){
			  playRoutes.controllers.Application.loadScenarioCtx($scope.selectedType.type).get().then(function(response){
				  var scenarioDescriptor = response.data;
				  $scope.scenarii.push({
					  type: $scope.selectedType.type,
					  driver: $scope.selectedType.name, //related service
					  columns: scenarioDescriptor,
					  rows: []
				  });
			  });
		  };

		  $scope.addRow = function(scenario, newRow){
			  scenario.rows.push(newRow);
			  $scope.newRow = {};
		  };

		  $scope.deleteRow = function(scenario, row){
			  //ajax call directly, if not new !
			  scenario.rows.splice(scenario.rows.indexOf(row), 1);
		  };

		  $scope.save = function(){
			  var copy = angular.copy($scope.scenarii);
			  var transformed_copy = copy.map(function(obj){
				  obj.rows = JSON.stringify(obj.rows);
				  delete obj.columns;
				  return obj;
			  });
			  playRoutes.controllers.Application.saveScenarii().post(transformed_copy).then(function(){
				  //ngProgress.complete();
			  });
		  };

		  $scope.importScenario = function(scenario){
			  var mode = scenario.selectedImportMode;
			  var toImport = scenario.imp;
			  if(mode == "prepend"){
				  scenario.rows = angular.copy(toImport.rows).concat(scenario.rows);
			  }else if(mode == "append"){
				  scenario.rows = scenario.rows.concat(angular.copy(toImport.rows));
			  }
			  delete scenario.imp;
			  delete scenario.selectedImportMode;
		  };
		  
		  $scope.OnPatternValueChange = function(row, position, value){
			//var index = $scope.scenarii[0].rows.indexOf(row);
			var newVal = {val: value, pos: position};
			if(angular.isUndefined(row.mappings)){
				row.mappings = [];
				row.mappings.push({val: value, pos: position});
			}else{
				var found = false;
				for(var i=0; i < row.mappings.length; i++){
					if(row.mappings[i].pos == position){
						row.mappings[i] = newVal;
						found = true;
					}
				}
				if(!found){
					row.mappings.push({val: value, pos: position})
				}
			}
			
		  }
	  },
	  ProjectCtrl: function($rootScope, $scope, playRoutes, ngProgress, $window){
			$scope.projects = [];

		    playRoutes.controllers.Application.loadProject().get().then(function(response) {
			  	var data = response.data || [];
				$scope.projects = data;
		    });
			playRoutes.controllers.Application.loadScenarii().get().then(function(response) {
			  	var data = response.data || [];
			  	$scope.scenarii = data;
			});

		  	$scope.isNotSaved = function(project){
				return !angular.isDefined(project.id);
		    }

			$scope.addProjectBlock = function(){
				$scope.projects.push({name: "project", campaigns: []});
			}
			
			$scope.addCampaignToProject = function(project){
				project.campaigns.push({name:"new campaign", scenarii: []});
			}
			
			$scope.addScenarioToCampaign = function(campaign){
				campaign.scenarii.push({});
			}
			
			$scope.deleteCampaign = function(campaign, project){
				project.campaigns.splice(project.campaigns.indexOf(campaign),1);
			}
			
			$scope.deleteScenario = function(scenario, campaign){
				campaign.scenarii.splice(campaign.scenarii.indexOf(scenario),1);
			}
			
			$scope.saveProject = function(project){
				playRoutes.controllers.Application.saveProject().post(project).then(function(response) {
				});
			}

		  	$scope.showDetails = function(scenario){
				alert("TODO: Implement details display !")
			}

		    $scope.disableProject = function(project){
				alert("TODO: Implement disabling projects !")
			}

		  	$scope.displayReport = function(project){
				$window.open("/loadProjectReport/"+project.name)
				playRoutes.controllers.Application.loadProjectReport(project.name).get().then(function(response) {
					console.log(response)
				});
			}
	  },
	  MainCtrl: function($rootScope, $scope, playRoutes, $location) {

		  $scope.logout = function(){
			  playRoutes.controllers.Application.logout().get().then(function(response){
				  $rootScope.user = "";
				  window.location.href = "/";
			  });
		  }
	  }
  };
});