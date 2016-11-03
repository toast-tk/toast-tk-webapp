define(["angular"], function (angular) {
    "use strict";

    // The module - will be referenced by other modules
    var module = angular.module('tk.services', ['play.routing']);

    module.constant('webSocket', WebSocket);
    module.factory('ClientService', ['playRoutes','webSocket',
        function(playRoutes, webSocket){
            var factory = {};
            factory.recorders = [];
            factory.socketIsActive = false;
            factory.registerAgentListener = function(callback){
                factory.agentListenerCallback = callback;
                playRoutes.controllers.AgentController.getAgents(factory.accessToken).get().then(function (response) {
                    factory.agents  = response.data || [];
                    factory.agentListenerCallback.call(this, 'set', factory.agents);
                });
            };
            factory.accessToken = null;
            factory.socketIsActive = false;
            factory.agents = [];
            factory.regexList = [];
            factory.regexMap = {};

            factory.opensocket = function(accessToken){
                if(factory.accessToken === null || factory.socketIsActive === false){
                    factory.accessToken = accessToken;
                    var location = window.location;
                    var port = location.port === "" ? "" : ":" + location.port;
                    var path = location.pathname;
                    var protocol = location.protocol === "https" ? "wss" : "ws";
                    var socket = new webSocket(protocol + '://' + location.host + path + 'socket/stream?token=' + accessToken);

                    // When the connection is open, send some data to the server
                    socket.onopen = function (event) {
                        factory.socketIsActive = true;
                        console.log(event)
                    };

                    socket.onclose = function (error) {
                        console.log('WebSocket: connection closed');
                        resetWS();
                    };

                    socket.onerror = function (error) {
                        console.log('WebSocket: connection on error');
                        resetWS();
                    };

                    var resetWS = function(){
                        factory.socketIsActive = false;
                    }

                    socket.onmessage = function (event) {
                        try{
                            console.log("WebSocket: received ws data: " + event.data);
                            var agent = angular.fromJson(event.data);
                            if(agent){
                                if(agent.sentence){
                                    if(factory.agentListenerCallback){
                                        factory.agentListenerCallback.call(this, 'sentence', agent);
                                    } else {
                                        console.log('WebSocket: no agent sentence listener defined');
                                    }
                                }else {
                                    if(agent.isAlive === true){
                                        var result = factory.agents.filter(function( obj ) {
                                            return obj.host === agent.host && object.token === agent.token;
                                        });
                                        if(result.length === 0){
                                            console.log('WebSocket: new agent available at host: ' + agent.host);
                                            factory.agents.push(agent);
                                            if(factory.agentListenerCallback){
                                                factory.agentListenerCallback.call(this, 'set', factory.agents);
                                            } else {
                                                console.log('WebSocket: no agent listener defined');
                                            }
                                        }
                                    }else {
                                        var indexOfAgent = factory.agents.findIndex(function( obj ) {
                                            return obj.host === agent.host && object.token === agent.token;
                                        });
                                        console.log('Agent is no longer active at host: ' + agent.host);
                                        var agentToRemove = factory.agents[indexOfAgent];
                                        factory.agents.splice(indexOfAgent, 1);
                                        if(factory.agentListenerCallback){
                                            factory.agentListenerCallback.call(this, 'set', factory.agents);
                                            factory.agentListenerCallback.call(this, 'unset', agentToRemove);
                                        } else {
                                            console.log('WebSocket: no agent listener defined');
                                        }
                                    }
                                }
                            }
                        }catch(e){
                            console.log('WebSocket: error processing web socket message: ' + event);
                        }
                    };
                }
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
                            if(connectorConfig[k].group == scenariiKind){
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

            factory.actionItemType = function(actionItem){
                var match = /{{([\w:]+)}}/gi.exec(actionItem);
                if(match != null) {
                    var actionItemDefinition = match[1];
                    var groupArray = actionItemDefinition.split(":");
                    if(groupArray.length == 1) {
                        return {
                            category : groupArray[0],
                            type: "string"
                        }
                    }
                    else if(groupArray.length == 2) {
                        return {
                            category : groupArray[0],
                            type: groupArray[1]
                        }
                    }
                    else if(groupArray.length == 3) {
                        return {
                            category : groupArray[0],
                            type: groupArray[1]
                        }
                    }
                }
            }

            factory.convertSentence = function(sentence, callback){
                var convertedSentence = sentence;
                var actionItemRegex = /{{([\w:]+)}}/gi;
                var match = actionItemRegex.exec(sentence);
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
                    match = actionItemRegex.exec(convertedSentence);
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
        }]);
});