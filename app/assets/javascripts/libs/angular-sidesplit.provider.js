(function() {
	'use strict';
	angular.module("sidesplit", []);
	
	angular.module("sidesplit")
	  .provider('$sideSplit', function() {
		    var $sideSplitProvider = {
		      options: {
		      },
		      $get: ['$injector', '$rootScope', '$q', '$document', '$animate', '$templateRequest', '$controller', '$compile',
		        function ($injector, $rootScope, $q, $document, $animate, $templateRequest, $controller, $compile) {
		    	  var self = this;
		    	  this.openCallBacks = {};
		    	  this.closeCallBacks = {};
		    	  this.collapseCallBacks = {};
		    	  this.expandCallBacks = {};
		    	  
		    	  return { 
		    		  		open : open,
		    		  		close : close,
		    		  		collapse: collapse,
		    		  		addOpenCallBack: addOpenCallBack,
		    		  		addCloseCallBack: addCloseCallBack,
		    		  		addCollapseCallBack: addCollapseCallBack 
		    		  	 };

		          // BEGIN : add open callBackFunction
		    	  function addOpenCallBack(element,callback){
		    		  if(!angular.isDefined(self.openCallBacks[element])){
		    			  self.openCallBacks[element] = [];
		    		  }
		    		  self.openCallBacks[element].push(callback) ;
		    	  }
		          // END : add open callBackFunction
		    	  
		          // BEGIN : add close callBackFunction
		    	  function addCloseCallBack(element, callback){
		    		  if(!angular.isDefined(self.closeCallBacks[element])){
		    			  self.closeCallBacks[element] = [];
		    		  }
		    		  self.closeCallBacks[element].push(callback);
		    	  }
		          // END : add close callBackFunction

		          // BEGIN : add collapse callBackFunction
		    	  function addCollapseCallBack(element, callback){
		    		  if(!angular.isDefined(self.collapseCallBacks[element])){
		    			  self.collapseCallBacks[element] = [];
		    		  }
		    		  self.collapseCallBacks[element].push(callback);
		    	  }
		          // END : add collapse callBackFunction

		          // BEGIN : add Expand callBackFunction
		    	  function addExpandCallBack(element, callback){
		    		  if(!angular.isDefined(self.expandCallBacks[element])){
		    			  self.expandCallBacks[element] = [];
		    		  }
		    		  self.expandCallBacks[element].push(callback);
		    	  }
		          // END : add expand callBackFunction
		    	  
		          // BEGIN : collapse sidesplit function
		          var isCollapsed = false;
		    	  function collapse(sideSplitOptions){
		    		  if(sideSplitOptions.id){
		    			  var appendToElement = sideSplitOptions.id;
		    			  	  isCollapsed = !isCollapsed ;
		    			  	  if(sideSplitOptions.message) {console.log("collapsing message", sideSplitOptions.message)};
	                    	  angular.forEach(self.collapseCallBacks[sideSplitOptions.id],function(callback, key){
	                    		  callback(isCollapsed);
	                    	  });
//	                    	  $animate.leave(appendToElement);
		    		  } 
		    	  }
		          // END : collapse sidesplit function

		          // BEGIN : expand sidesplit function
		    	  function expand(sideSplitOptions){
		    		  if(sideSplitOptions.id){
		    			  var appendToElement = sideSplitOptions.id;
		    			  	  if(sideSplitOptions.message) {console.log("expanding message", sideSplitOptions.message)};
	                    	  angular.forEach(self.expandCallBacks[sideSplitOptions.id],function(callback, key){
	                    		  callback();
	                    	  });
//	                    	  $animate.leave(appendToElement);
		    		  } 
		    	  }
		          // END : expand sidesplit function

		          // BEGIN : close sidesplit function
		    	  function close(sideSplitOptions){
		    		  if(sideSplitOptions.id){
		    			  var appendToElement = sideSplitOptions.id;
		    			  	  if(sideSplitOptions.message) {console.log("closing message", sideSplitOptions.message)};
	                    	  appendToElement.html('');
	                    	  angular.forEach(self.closeCallBacks[sideSplitOptions.id],function(callback, key){
	                    		  callback();
	                    	  });
//	                    	  $animate.leave(appendToElement);
		    		  } 
		    	  }
		          // END : close sidesplit function
		          // BEGIN : open sidesplit function		    	  
		          function open(sideSplitOptions){
		        	  var sideSplitScope = (sideSplitOptions.scope || $rootScope).$new();
		        	  var isClickInsideSideSplit = false;
		        	  sideSplitScope.clickedDomEl = function(){
                      	//console.log("clicked side menu");
                      	isClickInsideSideSplit = true;
                      }
		        	  var ctrlInstance, ctrlLocals = {};
		        	  var resolveIter = 1;
		        	  ctrlLocals.$scope =  sideSplitScope ;
		        	  
		        	  $animate.enabled(true);
		        	  
		              var templateAndResolvePromise =
		                  $q.all([getTemplatePromise(sideSplitOptions)].concat(getResolvePromises(sideSplitOptions.resolve)));

		                function resolveWithTemplate() {
		                  return templateAndResolvePromise;
		                }
		              
		              if (angular.isDefined(sideSplitOptions.templateUrl)) {
			                templateAndResolvePromise.then(function(tplAndVars){
			                	  var template = angular.element(tplAndVars[0]);
			                      if (sideSplitOptions.controller) {
			                          angular.forEach(sideSplitOptions.resolve, function(value, key) {
			                              ctrlLocals[key] = tplAndVars[resolveIter++];
			                            });
			                          var ctrlInstance = $controller(sideSplitOptions.controller, ctrlLocals);
			                          if (sideSplitOptions.controllerAs) {
			                        	  sideSplitScope[sideSplitOptions.controllerAs] = ctrlInstance;
			                          }
			                          $compile(template)(sideSplitScope, undefined, {transcludeControllers: ctrlInstance});
			                      } else {
			                    	  $compile(template)(sideSplitScope);
			                      }
			                      
			                      var angularDomEl = angular.element('<div ng-click="clickedDomEl()"></div>');
			                      angularDomEl.html(tplAndVars[0]);
			                        var positionClass =  sideSplitOptions.position ? 'sidesplit-' + sideSplitOptions.position : 'sidesplit-right';
			                        positionClass += sideSplitOptions.isAbsolute == true ? " sidesplit-abs " : "";
			                        positionClass += sideSplitOptions.animation == "right"  ? " sidesplit-right-animation " : "" ;
			                        $animate.addClass(angularDomEl, 'sidesplit '+ positionClass);	
			                        
			                        
			                        
			                        if(sideSplitOptions.width){
			                        	angularDomEl.css("width", sideSplitOptions.width);	
			                        }
			                        if(sideSplitOptions.height){
			                        	angularDomEl.css("height", sideSplitOptions.height);	
			                        }
			                        
			                      var appendToElement = sideSplitOptions.appendTo || $document.find('body').eq(0);
			                      if(sideSplitOptions.isAppend != true){
			                    	  appendToElement.html('');
			                      }
			                      $animate.enter(angularDomEl, appendToElement)
			                      .then(function() {
			                        $compile(angularDomEl)(sideSplitScope);

			                        window.onclick = function() {
			                        	if(sideSplitOptions.hideOnClickout == true){
				                        	if(isClickInsideSideSplit == false){
				                        		close({ 
				                        			id:  appendToElement,
				                        			message :"closed with click out!"
				                        		});
				                        	} else if(isClickInsideSideSplit == true){
				                        		isClickInsideSideSplit = false;
				                        	}
			                        	}
			                        };
			                        
			                        // begin : running callBacks
			                        angular.forEach(self.openCallBacks[appendToElement],function(callback, key){
			                    		  callback();
			                    	});
			                        if(angular.isFunction(sideSplitOptions.openCallBack)){
			                        	sideSplitOptions.openCallBack();
			                        }
			                        // end : running callBacks			                    	
			                        
//			                        var positionClass =  sideSplitOptions.position ? 'sidesplit-' + sideSplitOptions.position : 'sidesplit-right';
//			                        positionClass += sideSplitOptions.isAbsolute == true ? " sidesplit-abs" : "";
//			                        $animate.addClass(appendToElement, 'sidesplit '+ positionClass);		                        
			                      });

			                });
		              }
		              
		          }
		          // END : open sidesplit function
		          
		      	// ---------------
		    	  // BEGIN : get template promise
		        function getTemplatePromise(options) {
		            return options.template ? $q.when(options.template) :
		              $templateRequest(angular.isFunction(options.templateUrl) ?
		                options.templateUrl() : options.templateUrl);
		        }
		        // END : get template promise
		        // BEGIN : get resolve promise
		        function getResolvePromises(resolves) {
		            var promisesArr = [];
		            angular.forEach(resolves, function(value) {
		              if (angular.isFunction(value) || angular.isArray(value)) {
		                promisesArr.push($q.when($injector.invoke(value)));
		              } else if (angular.isString(value)) {
		                promisesArr.push($q.when($injector.get(value)));
		              } else {
		                promisesArr.push($q.when(value));
		              }
		            });
		            return promisesArr;
		          }
		        // END : get resolve promise
		        // ----------------
		        
		        }
		      ]
		    };

		    return $sideSplitProvider;
		  });
	  
})();


