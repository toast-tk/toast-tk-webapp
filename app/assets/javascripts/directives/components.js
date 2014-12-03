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
					   patternModel: "=",
					   callback: '&onPatternChange'
					},   	
	        link: function ($scope, element, attrs) { 
	        	var regex = /(@)\[\[(\d+):([\w\s\.\-]+):([\w\s@\.,-\/#!$%\^&\*;:{}=\-_`~()]+)\]\]/gi
				var tag = "";
				var tags = [];
				var init = false;
	        	$scope.$watch('patternValue + patternPost + patternColumn + patternModel + patternContext', function(){
		        	if(!init){
		        		if($scope.patternPost == "true"){
		        			var e = $compile('<input type="text" ng-model="patternModel[patternColumn]" placeholder="{{patternColumn}}" style="width: 100%;"/>')($scope);
		        			element.append(e);
		        		}else{
		        			var patternValue = $scope.patternValue;
							if(patternValue == "" || angular.isUndefined(patternValue)){
								var e = $compile('<input type="text" ng-model="patternModel[patternColumn]" placeholder="{{patternColumn}}" style="width: 100%;"/>')($scope);
								element.append(e);
							}else{
								//round I: element creation
								tags = [];
								var tagPosition = 0;
								while (tag != null) {
									if(tag != ""){
										tags.push(tag);
										var varType = tags[tagPosition][3];
										var varDescriptor = tags[tagPosition][4];
										var replacementTag = getTagForType(tagPosition , varType, varDescriptor);
										patternValue = replaceIndex(patternValue, tags[tagPosition][0],  tags[tagPosition].index , replacementTag);
										tagPosition = tagPosition + 1;
									}
									tag = regex.exec(patternValue);
								}
								
								element.append($("<span>" + patternValue + "</span>"));
								
								//round II: element binding
								for(var i=0; i<tags.length; i++){
									var tagPosition = i;
									var varType = tags[i][3];
									var varDescriptor = tags[i][4];
									updateOptionsForReference(tagPosition, varDescriptor, $scope.patternContext);
								}
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
	        			return '<input type="text" class="'+varDescriptor+ '_' + tagPosition +'"/>';
	        		} else if (varType == "reference"){
	        			return '<select class="'+varDescriptor+ '_' + tagPosition +'"></select>';
	        		} else {
	        			return '<input type="text" class="'+varDescriptor+ '_' + tagPosition +'" placeholder="'+varType+'"/>';
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
								
								if($scope.patternModel.mappings){
									var mappings = $scope.patternModel.mappings;
									for(var i=0; i < mappings.length; i++){
										if(mappings[i].pos == tagPosition){
											select.val(mappings[i].val)
										}
									}
								}
								
								select.change(function(){
									$scope.$apply(
										function(){
											$scope.callback({row: $scope.patternModel, position: tagPosition, value: select.find("option:selected").text()});
										}
									);
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
								
								if($scope.patternModel.mappings){
									var mappings = $scope.patternModel.mappings;
									for(var i=0; i < mappings.length; i++){
										if(mappings[i].pos == tagPosition){
											select.find("option").filter(function() {
												return $(this).text() == mappings[i].val; 
											}).prop('selected', true);
										}
									}
								}
								
								select.change(function(){
									$scope.$apply(function(){
											$scope.callback({row: $scope.patternModel, position: tagPosition, value: select.find("option:selected").text()});
										}
									);
								});
							});
						}
					}
					else if(descriptor == 'Entity'){
	        		
	        		}
					else if(descriptor == 'String'){
						var input = element.find('.'+descriptor+'_'+tagPosition);
						
						if($scope.patternModel.mappings){
							var mappings = $scope.patternModel.mappings;
							for(var i=0; i < mappings.length; i++){
								if(mappings[i].pos == tagPosition){
									input.val(mappings[i].val);
								}
							}
						}
						
						input.change(function(){
							$scope.$apply(function(){
									$scope.callback({row: $scope.patternModel, position: tagPosition, value: input.val()});
								}
							);
						});
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