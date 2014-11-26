define(["angular", "qTags"], function (angular, qTags) {
  	"use strict";

  	// The module - will be referenced by other modules
  	var module = angular.module("red.components", ["play.routing"]);
  
	module.directive('sentence', function ($compile) {
	    return {
	    	restrict: 'E',
			scope: {
				callback: '&onAdd'
			},	    	
	        link: function ($scope, element, attrs) { 
	        	var content = $('<span class="sentence"></span>');	
	        	var addHtml = $('<button class="btn btn-primary">+</button>');
	        	var html = '<textarea ng-model="newSentence" placeholder="sentence (use @)" style="width: 100%;" /> ';
	        	var e = $compile(html)($scope);
            	
            	content.append(e);
            	content.append(addHtml);
            	element.replaceWith(content);	
            	
				$(e).textntags({
			        triggers: {'@': {uniqueTags: false}},
			        onDataRequest:function (mode, query, triggerChar, callback) {
			            var data = [
			                { id:1, name:'String', 'type':'string'},
			                { id:2, name:'Date', 'type':'date'},
			                { id:3, name:'Int', 'type':'int'},
			                { id:4, name:'WebPageItem', 'type':'reference', description: ''},
			                { id:5, name:'Entity', 'type':'reference'},
							{ id:6, name:'SwingComponent', 'type':'reference', description: ''}
						];
			            query = query.toLowerCase();
			            var found = _.filter(data, function(item) { return item.name.toLowerCase().indexOf(query) > -1; });
			
			            callback.call(this, found);
			        }
			    })    
			    .bind('tagsAdded.textntags', function (e, addedTagsList) { 
			    	console.log('tagsAdded:' + JSON.stringify(addedTagsList)); 
			    })
    			.bind('tagsRemoved.textntags', function (e, removedTagsList) { 
    				console.log('tagsRemoved:' + JSON.stringify(removedTagsList)); 
    			});
    				
    			$(addHtml).click(function() {
			        $(e).textntags('val', function(text) {
			        	$scope.$apply(function(){
				        	$scope.callback({a:$scope.newSentence, b:text});
				        	$scope.newSentence = "";
			        	});
			        });
			        $(e).textntags('reset');
			    });
			} 
	    };
	});
	
	module.directive('pattern', function ($compile, playRoutes) {
	    return {
	    	restrict: 'A',
	    	scope: {    
					   patternValue: "@",
					   patternPost: "@",
					   patternColumn: "@",
				       patternContext: "@",
					   patternModel: "="
					},   	
	        link: function ($scope, element, attrs) { 
	        	var regex = /(@)\[\[(\d+):([\w\s\.\-]+):([\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+)\]\]/gi
				var match = "";
				var tags = [];
				var init = false;
	        	$scope.$watch('patternValue + patternPost + patternColumn + patternModel + patternContext', function(){
		        	if(!init){
		        		if($scope.patternPost == "true"){
		        			var e = $compile('<input type="text" ng-model="patternModel[patternColumn]" placeholder="{{patternColumn}}" style="width: 100%;"/>')($scope);
		        			element.append(e);
		        		}else{
		        			var patternValue = $scope.patternValue;
							if(patternValue == "" || !angular.isObject(patternValue) || angular.isUndefined(patternValue)){
								var e = $compile('<input type="text" ng-model="patternModel[patternColumn]" placeholder="{{patternColumn}}" style="width: 100%;"/>')($scope);
								element.append(e);
							}else{
								while (match != null) {
									if(match != ""){
										tags.push(match);
									}
									match = regex.exec(patternValue);
								}

								for(var i=0; i<tags.length; i++){
									patternValue = replaceIndex(patternValue, tags[i][0],  tags[i].index , getTagForType(i ,tags[i][3], tags[i][4]));
								}
								element.append($("<span>" + patternValue + "</span>"));
							}
		        		}
		        		init = true;
	        		}
	        	});
	        	
	        	/** util functions */
	        	function replaceIndex(string, regex, at, repl) {
				   return string.replace(regex, function(match, i) {
				        if( i === at ) return repl;
				        return match;
				    });
				}
					        	
	        	function getTagForType(tagPosition, varType, varDescriptor){
	        		if(varType == "string"){
	        			return '<input type="text"/>';
	        		} else if (varType == "reference"){
	        			updateOptionsForReference(tagPosition, varDescriptor, $scope.patternContext); //get context from model, add related service name
	        			return '<select class="'+varDescriptor+ '_' + tagPosition +'"></select>';
	        		} else {
	        			return '<select></select>';
	        		}
	        	}
	        	
	        	function updateOptionsForReference(tagPosition, descriptor, ctx){
	        		if(descriptor == 'WebPageItem'){
	        			if(ctx == "web"){
	        				//call play service
	        				playRoutes.controllers.Application.loadCtxTagData(descriptor).get().then(function(response){
	        					var select = element.find('.'+descriptor+'_'+tagPosition);
	        					$.each(response.data, function(key, value) {   
								     select.append($('<option>', { value : key }).text(value)); 
								});
	        				});
	        			}
	        		}
					else if(descriptor == 'SwingComponent'){
						if(ctx == "swing"){
							//call play service
							playRoutes.controllers.Application.loadCtxTagData(descriptor).get().then(function(response){
								var select = element.find('.'+descriptor+'_'+tagPosition);
								$.each(response.data, function(key, value) {
									select.append($('<option>', { value : key }).text(value));
								});
							});
						}
					}
					else if(descriptor == 'Entity'){
	        		
	        		}
	        	}
	        	
			} 
	    };
	});
	
	module.directive('template', function ($compile, playRoutes) {
	    return {
	    	restrict: 'A',	
	    	scope: {    
					   templateValue: "@",
					   templatePost: "@",
					   templateConfigType: "@",
					   templateContext: "@",
					   ngModel: "="
					},    	
	        link: function ($scope, element, attrs) { 
	        
				var init = false;
				
	        	$scope.$watch('templateValue + ngModel + templatePost + templateConfigType + templateContext', function(){
	        		if(!init && ( $scope.templateValue && $scope.templatePost && $scope.templateConfigType && $scope.templateContext)){
		        		var templateValue = $scope.templateValue;
		        		var templateModel = $scope.templateModel;
		        		
		        		playRoutes.controllers.Application.loadCtxSentences($scope.templateConfigType, $scope.templateContext).get().then(function(response){
		        			$scope.values = response.data || [];
							$scope.values.unshift({sentence: "free text", typed_sentence : ""});
							if($scope.templatePost == "true"){
								element.replaceWith($("<span></span>"))
							}
							else if(templateValue == "true"){
								var el = $compile('<select ng-model="ngModel" ng-options="value.typed_sentence as value.sentence for value in values"></select>')($scope);
					        	element.replaceWith(el);
							}
							init = true;
		        		});
					}
	        	});
			} 
	    };
	});
	

  	return module;
});