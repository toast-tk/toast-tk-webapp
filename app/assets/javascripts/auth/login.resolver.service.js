define(["angular"], function (angular) {
  "use strict";
  return {
	ResolversService : function (LoginService, $state, $q) {
		
		return {
			checkLoggedLoginResolve : checkLoggedLoginResolve,
			checkLoggedAndGetUserResolve : checkLoggedAndGetUserResolve
		};
	
		// --------------------- Resolvers ----------------------		
		function checkLoggedLoginResolve() {
			LoginService.sync()
			if (LoginService.isAuthenticated()) {
				$state.go("layout.scenario");
			}
		}
		
		function checkLoggedAndGetUserResolve(){
			var deferred = $q.defer();
			LoginService.sync()
		 	if (LoginService.isAuthenticated() === true) {
		 		var user  = LoginService.currentUser();
		 		deferred.resolve(user);
		 	} else {
		 		$state.go("login");
		 	 	deferred.reject();
		 	}
		 	return deferred.promise;
	    }
	}

    }
   });