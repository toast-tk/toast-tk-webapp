define(["angular"], function (angular) {
  	"use strict";

  	// The module - will be referenced by other modules
  	var module = angular.module("tk.services", ["play.routing"]);

  	module.factory('ClientService', function(playRoutes){
  		var factory = {};

        factory.ACTION_ITEM_REGEX = /{{([\w:]+)}}/gi;
        factory.recorders = [];
        factory.socketIsActive = false;
        factory.recorderListener = null;
        factory.sentenceListener = null;
        factory.regexList = [];
        factory.regexMap = {};

        var socket = new WebSocket('ws://localhost:9000/socket/stream');

        // When the connection is open, send some data to the server
        socket.onopen = function (event) {
            factory.socketIsActive = true;
            console.log(event)
        };

        socket.onclose = function (error) {
            factory.socketIsActive = false;
        };

        socket.onerror = function (error) {
            factory.socketIsActive = false;
        };

        socket.onmessage = function (event) {
            var data = event.data;
            if(data.startsWith("driver:")){
                if(factory.recorderListener){
                    factory.recorderListener(data);
                }
                console.log("No driver listener defined")
            }
            if(data.startsWith("sentence: ")){
                var sentenceRecord = angular.fromJson(data.substring("sentence: ".length))
                if(factory.sentenceListener){
                    factory.sentenceListener(sentenceRecord);
                }else{
                    console.log("No sentence listener defined")
                }
            }
            console.log(event.data)
        };


        factory.setDriverListener = function(listener){
            factory.recorderListener = listener;
        }

        factory.setSentenceListener = function(listener){
            factory.sentenceListener = listener;
        }

        factory.init = function(){
			playRoutes.controllers.DomainController.typeDescriptor().get().then(function(response){
				factory.typeDescriptor = response.data || [];
	    	});	
		}

		factory.loadRegexList = function(scenariiKind, callback){
			playRoutes.controllers.Application.loadCtxSentences(scenariiKind).get().then(function(response){
                var url = response.config.url.split("/")
                var scenariiKind = url[url.length -1];
                var list = [];
                var connectorConfigGroups = response.data;
                for(var j = 0; j< connectorConfigGroups.length; j++){
                    for (var k=0; k< connectorConfigGroups[j].rows.length; k++){
                        var connectorConfig = connectorConfigGroups[j].rows;
                        if(connectorConfig[k].type == scenariiKind){
                            list = list.concat( connectorConfig[k].syntax || []);
                        }
                    }
                }
                factory.regexList = factory.regexList.concat(list || []);
                factory.regexMap[scenariiKind] = list;
                callback.call(callback, scenariiKind, list);
            });
		}

		factory.convertToPatternSentence = function(sentence){
			return factory.convertSentence(sentence, getActionItemPattern);
		};

		factory.convertSentence = function(sentence, callback){
			var convertedSentence = sentence;
			var match = factory.ACTION_ITEM_REGEX.exec(sentence);
			while(match != null) {
				var actionItemDefinition = match[1];
				var groupArray = actionItemDefinition.split(":");
				var regex = null;
				if(groupArray.length == 1) {
					var category = groupArray[0];
					regex = callback.call(callback, category, "string");
				}
				else if(groupArray.length == 2) {
					var category = groupArray[0];
					var type = groupArray[1];
					regex = callback.call(callback, category, type);
				}
				else if(groupArray.length == 3) {
					var category = groupArray[1];
					var type = groupArray[2];
					regex = callback.call(callback, category, type);
				}
				if(regex != null) {
					convertedSentence = convertedSentence.replace(new RegExp(match[0], 'g'), regex);
				}
				match = factory.ACTION_ITEM_REGEX.exec(convertedSentence);
			}
			return convertedSentence;
		}

  		factory.convertToRegexSentence = function(sentence, callback){
			return factory.convertSentence(sentence, getActionItemRegex);
		}

		function getActionItemPattern(category, type){
			for(var i = 0; i < factory.typeDescriptor.length; i++){
				var descriptor = factory.typeDescriptor[i];
				if(descriptor.category == category) {
					if(descriptor.kind  == type) {
						return descriptor.replacement;
					}
				}
			}
			return null;
		}

		function getActionItemRegex(category, type){
			for(var i = 0; i < factory.typeDescriptor.length; i++){
				var descriptor = factory.typeDescriptor[i];
				if(descriptor.category == category) {
					if(descriptor.kind  == type) {
						return descriptor.regex;
					}
				}
			}
			return null;
		}
  		factory.init();
  		return factory;
  	});
});