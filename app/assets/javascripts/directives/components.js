define(["angular", "qTags"], function (angular, qTags) {
  	"use strict";

  	// The module - will be referenced by other modules
  	var module = angular.module("tk.components", ["play.routing"]);
  
	module.directive('sentence', function ($compile, playRoutes) {
	    return {
	    	restrict: 'E',
			scope: {
				callback: '&onAdd'
			},	    	
	        link: function ($scope, element, attrs) { 
	        	var content = $('<span class="sentence"></span>');	
	        	//disabled !
	        	var addHtml = $('<button ng-disabled class="btn btn-primary">+</button>');
	        	var html = '<textarea ng-disabled ng-model="newSentence" placeholder="sentence (use @)" style="width: 100%;" /> ';
	        	var tagElement = $compile(html)($scope);
            	
            	content.append(tagElement);
            	content.append(addHtml);
            	element.replaceWith(content);	

				$(tagElement).textntags({
			        triggers: {'@': {uniqueTags: false}},
			        onDataRequest:function (mode, query, triggerChar, callback) {
			        	playRoutes.controllers.DomainController.typeDescriptor().get().then(function(response){
		        			var data = response.data || [];
			            	query = query.toLowerCase();
			            	var found = _.filter(data, function(item) { return item.name.toLowerCase().indexOf(query) > -1; });
			            	callback.call(this, found);
			        	});
			        }
			    })    
			    .bind('tagsAdded.textntags', function (e, addedTagsList) { 
			    	$(tagElement).textntags('editorVal', function(editorText) {
			        	$scope.newSentence = editorText;
			    		$scope.$digest();
			        });
			    	console.log('tagsAdded:' + JSON.stringify(addedTagsList)); 
			    })
    			.bind('tagsRemoved.textntags', function (e, removedTagsList) { 
    				$(tagElement).textntags('editorVal', function(editorText) {
			        	$scope.newSentence = editorText;
			    		$scope.$digest();
			        });
    				console.log('tagsRemoved:' + JSON.stringify(removedTagsList)); 
    			});
    				
    			$(addHtml).click(function() {
			        $(tagElement).textntags('val', function(text) {
			        	$scope.$apply(function(){
				        	$scope.callback({a:$scope.newSentence, b:text});
				        	$scope.newSentence = "";
			        	});
			        });
			        $(tagElement).textntags('reset');
			    });
			} 
	    };
	});
	
	module.directive('pattern', function ($compile, playRoutes, $rootScope, $filter) {
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
	        	var regex = /{{([\w:]+)}}/gi
	        	var watcher = $scope.$watch('patternValue + patternPost + patternColumn + patternModel + patternContext', function(){
	        		element.empty();
	        		if($scope.patternPost == "true"){
	        			var e = $compile('<input type="text" ng-model="patternModel[patternColumn]" placeholder="{{patternColumn}}" style="width: 100%;"/>')($scope);
	        			element.append(e);
	        		}else{
	        			var patternValue = $scope.patternValue;
						if(patternValue == "" || angular.isUndefined(patternValue)){
							var e = $compile('<input type="text" ng-model="patternModel[patternColumn]" style="width: 100%;"/>')($scope);
							element.append(e);
						}else{
							//round I: element creation
							var tags = [];
							var tagPosition = 0;
							var previousIndex = 0;
							var tag = regex.exec(patternValue);
							while (tag != null) {
								//add tag
								tags.push(tag);

								//get tag information details
								var varValue = tags[tagPosition][1];
								var varCategory = varValue.split(':')[0];
								var varType = varValue.split(':')[1];
								var replacementTag = "<span class='item-wrapper'>" +getTagForType(varCategory, tagPosition)+ "</span>";
								var tagIsolatedScope = $rootScope.$new(true, $scope);
								
								if(varCategory == "value"){
									initialiseValueScope(tagIsolatedScope, tagPosition);
								}
								else if(varCategory == "component"){
									initialiseOptionScope(tagIsolatedScope, tagPosition, varCategory, varType);
								}
								
								var replacementTagElement = $compile(replacementTag)(tagIsolatedScope);
								element.append("<span>"+patternValue.substring(previousIndex, tags[tagPosition].index)+"</span>");
								element.append(replacementTagElement);
								previousIndex = tags[tagPosition].index + replacementTag.length;
								patternValue = replaceIndex(patternValue, tags[tagPosition][0],  tags[tagPosition].index , replacementTag);
								tagPosition = tagPosition + 1;
								tag = regex.exec(patternValue);
							}
							if(tags.length == 0){
								element.append($("<span>" + patternValue + "</span>"));
							}
						}
	        		}
	        		watcher();
	        	});


				function initialiseOptionScope(tagIsolatedScope, tagPosition, varCategory, varType){
					playRoutes.controllers.Application.loadCtxTagData(varType).get().then(function(response){
						var tagValue;
						var options = [];
						var selected_option_label = undefined;
						$.each(response.data, function(key, component) {
							options.push({ id : component.id, text : component.label });
						});

						if($scope.patternModel.mappings){
							var mappings = $scope.patternModel.mappings;
							for(var i=0; i < mappings.length; i++){
								if(mappings[i].pos == tagPosition){
									tagValue = $scope.patternModel.mappings[i].id;
									selected_option_label = $scope.patternModel.mappings[i].val;
									break;
								}
							}
						}
						tagIsolatedScope.references = options;
						tagIsolatedScope.editable = {
				    		value: angular.isDefined(tagValue) ? tagValue : varCategory + "?",
				    		label: selected_option_label
						}; 
						tagIsolatedScope.$watch("editable.value", function(){

							if(angular.isDefined(tagIsolatedScope.editable)){
								var label = undefined;
								var refs = tagIsolatedScope.references
								for(var i=0; i < refs.length; i++){
									if(refs[i].id == tagIsolatedScope.editable.value){
										tagIsolatedScope.editable.label = refs[i].text;
										break;
									}
								}
							
								$scope.callback({
									row: $scope.patternModel, 
									position: tagPosition, 
									identifier: tagIsolatedScope.editable.value,
									value: tagIsolatedScope.editable.label});
							}
						
						});
					});
				}

				function initialiseValueScope(tagIsolatedScope, tagPosition){
					var tagValue;
					if($scope.patternModel.mappings){
						var mappings = $scope.patternModel.mappings;
						for(var i=0; i < mappings.length; i++){
							if(mappings[i].pos == tagPosition){
								tagValue = mappings[i].val;
								break;
							}
						}
					}
					tagIsolatedScope.editable = {
				    	value: tagValue
					}; 
					tagIsolatedScope.$watch("editable.value", function(){
						if(angular.isDefined(tagIsolatedScope.editable)){
							$scope.callback({
								row: $scope.patternModel, 
								position: tagPosition, 
								identifier: tagPosition.toString(),
								value: tagIsolatedScope.editable.value});
						}
					});
				}
	        	
	        	/** util functions */
	        	function getIndex(array, word){
                	for(var i = 0 ; i< array.length; i++){
	                    if(array[i] == word){
	                        return i;
	                    }
	                }
	            }

	            function replaceIndex(string, regex, at, repl) {
	               return string.replace(regex, function(match, i) {
	                    if( i === at ) return repl;
	                    return match;
	                });
	            }
					        
				//put in webservice	
	        	function getTagForType(category, tagPosition){
	        		if(category == "value"){
	        			return '<a href="#" editable-text="editable.value">{{ editable.value || "value?" }}</a>';
	        		} 
	        		else if (category == "component"){
	        			return '<a href="#" editable-select="editable.value" e-ng-options="reference.id as reference.text for reference in references">{{ editable.label || "component?" }}</a>';
	        		} 
	        		else if(category == "variable"){
	        			return '<a href="#" editable-text="editable.value">{{ editable.value || "variable?" }}</a>';
	        		}
	        		else{
	        			return '<input type="text" class="'+category+ '_' + tagPosition +'" placeholder="'+category+'"/>';
	        		}
	        	}
			} 
	    };
	});
	
	module.directive("tkSlider", function($compile, $timeout){
		return {
	    	restrict: 'A',	   	
	        link: function ($scope, element, attrs) { 
	        	$timeout(function(){
	        		$(".slide-out-button").click(function(){
        			var positionOfEffectValue = 300;
	                var positionOfEffect = "-=" + (positionOfEffectValue) + "px";
	                $(".effectSideBar").animate({
	                    left: positionOfEffect
	                }, 500, function () {
	                	$(".slide-in-button").removeClass("hide");
                        $(".effectSideBar").attr("class", "effectSideBar hide");
                        $(".effectContent").attr("class", "effectContent col-md-12");
	                });
		        	});
		        	$(".slide-in-button").click(function(){
	        			var positionOfEffectValue = 300;
		                var positionOfEffect = "+=" + (positionOfEffectValue) + "px";
		                $(".effectSideBar").animate({
		                    left: positionOfEffect
		                }, 500, function () {
		                	$(".slide-in-button").addClass("hide");
	                        $(".effectSideBar").attr("class", "effectSideBar col-md-3");
	                        $(".effectContent").attr("class", "effectContent col-md-9");
		                });
		        	});

	        	}, 500);

	        	
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
					   ngModel: "="
					},    	
	        link: function ($scope, element, attrs) { 
				
	        	$scope.$watch('templateValue + templatePost + templateConfigType', function(){
	        		if($scope.templateValue && $scope.templatePost && $scope.templateConfigType){
		        		var templateValue = $scope.templateValue;
		        		
		        		playRoutes.controllers.Application.loadSentences($scope.templateConfigType).get().then(function(response){
		        			$scope.values = response.data || [];
							$scope.values.unshift({sentence: "Plain Text Step", typed_sentence : ""});
							if($scope.templatePost == "true"){
								element.replaceWith($("<span></span>"))
							}
							else if(templateValue == "true"){
								var el = $compile('<select ng-model="ngModel" ng-options="value.typed_sentence as value.sentence for value in values | orderBy: \'sentence\'"></select>')($scope);
					        	element.replaceWith(el);
							}
		        		});
					}
	        	});
			} 
	    };
	});
	
	
  	return module;
});