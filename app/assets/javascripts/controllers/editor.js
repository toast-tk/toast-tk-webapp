define(["angular"], function(angular) {
  "use strict";
  return {
    MainCtrl: function($rootScope, $scope, playRoutes) {
      	$scope.user = $rootScope.user;
      	
      	$scope.config_group_types = ["service", "entity"];
      	$scope.run_config_types = ["web page", "configure entity"]; 
      	$scope.service_config_types = ["web", "backend"];
      	
      	$scope.scenario_types = []; 	      	
		$scope.selectedType = "";
		$scope.selectedConfigGroupType = "";
		$scope.scenarii = [];
		$scope.configurations = [];
		$scope.autosetups = [];
		$scope.selectedConfig = undefined;
		$scope.newRow = {};
		$scope.newAutoSetupRow = {};
		
		playRoutes.controllers.Application.loadConfiguration().get().then(function(response){
			$scope.configurations = response.data || [];
			for(var i =0; i< $scope.configurations.length; i++){
				for(var j=0; j< $scope.configurations[i].rows.length; j++){
					$scope.scenario_types.push({name: $scope.configurations[i].rows[j].name, type: $scope.configurations[i].rows[j].type});
				}
			}
		});
		
		playRoutes.controllers.Application.loadAutoConfiguration().get().then(function(response){
			//convert autosetup rows into json
			$scope.autosetups = response.data.map(function(obj){
				obj.rows = JSON.parse(obj.rows)
				obj.columns = JSON.parse(obj.columns);
				return obj;
			});
			$scope.autosetups = $scope.autosetups || [];
		});
		
		$scope.addNewSentence = function(newSentence, sentenceWithTypes){
			$scope.selectedConfig.syntax.push({sentence: newSentence, typed_sentence: sentenceWithTypes});
		}
		
		$scope.deleteSentenceLine = function(newSentence){
			$scope.selectedConfig.syntax.splice($scope.selectedConfig.syntax.indexOf(newSentence),1);
		}
		
		$scope.addConfigBlock = function(){
			pushNewConfig();
		}
		
		$scope.addAutoSetupConfig = function(){
			playRoutes.controllers.Application.loadAutoSetupCtx($scope.selectedAutoSetupConfigType).get().then(function(response){
	      		var info = response.data;
	      		pushNewAutoSetupConfig(info);
	      	});
		}
		
		function pushNewAutoSetupConfig(autoSetupDescriptor){
			$scope.autosetups.push({type: $scope.selectedAutoSetupConfigType, 
									columns: autoSetupDescriptor.columns,
									rows: []});
		}
		
		function pushNewConfig(){
			//1. need a column descriptor 
			//2. column names & validator & datasource if there's an auto-complete
			$scope.configurations.push({type: $scope.selectedConfigType, rows: []});
		}
		
		$scope.editConfigLine = function(config, item){
			$scope.selectedConfig = config;
		}
		
		$scope.deleteConfigLine = function(config, item){
			config.rows.splice(config.rows.indexOf(item), 1);
		}
		
		$scope.addConfigLine = function(config, item){
			config.rows.push({name: item, syntax: []});
		}
		
      	$scope.add = function(){
	      	playRoutes.controllers.Application.loadScenarioCtx($scope.selectedType.type).get().then(function(response){
	      		var info = response.data;
	      		pushNewScenario(info);
	      	});
      	}
      	
      	function pushNewScenario(scenarioDescriptor){
			$scope.scenarii.push({	
									  type: $scope.selectedType.type,
									  driver: $scope.selectedType.name, //related service
									  columns: scenarioDescriptor.columns,
									  rows: []
								  });
		}
		
		
		$scope.addAutoSetupRow = function(autosetup, newRow){
			autosetup.rows.push(newRow);
			$scope.newAutoSetupRow = {};
		}
		
		$scope.addRow = function(scenario, newRow){
			scenario.rows.push(newRow);
			$scope.newRow = {};
		}
		
		$scope.deleteRow = function(scenario, row){
			//ajax call directly, if not new !
			scenario.rows.splice(scenario.rows.indexOf(row), 1);
		}
		
		$scope.saveConfig = function(){
			playRoutes.controllers.Application.saveConfiguration().post($scope.configurations).then(function(response){
	      		window.alert("Saved : " + response.data);
	      	});
		}
		
		$scope.saveAutoConfig = function(){
			var deepCopy = angular.copy($scope.autosetups);
			deepCopy = deepCopy.map(function(autoSetup){
				autoSetup.rows = JSON.stringify(autoSetup.rows);
				autoSetup.columns = JSON.stringify(autoSetup.columns);
				return autoSetup;
			});
			playRoutes.controllers.Application.saveAutoConfig().post(deepCopy).then(function(response){
	      		window.alert("Saved : " + response.data);
	      	});
		}
		
    }
  };
});