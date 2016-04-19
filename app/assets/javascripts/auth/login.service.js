define(["angular","jwtClient"], function (angular, JWT) {
  "use strict";
  return {
    LoginService: function ($state, playRoutes) {
      var self = this ;
      self.user = null;
      return {
        login: login,
        logout: logout,
        isAuthenticated: isAuthenticated,
        currentUser: currentUser,
        sync : sync
      }

  // Send a login to the server...
  function login(data) {
   return playRoutes.controllers.Application.login().post(data).then(function(response) {
      var token = response.headers("Authorization");
      var session = JWT.read(token);
      if (JWT.validate(session)) {
        JWT.keep(token);
        sync();
      } else {
        logout();
      }
         // return playRoutes.controllers.Users.user(3).get(); // return promise so we can chain easily
       }).then(function(response) {
          console.log("login unexpected problem ", response);
        });
  }

      function logout() {
        console.log("self.user", self.user);
        playRoutes.controllers.Users.logout(self.user.id).get().then(function (response) {    
          JWT.forget();
          sync();
          $state.go("login");
        });
      }

  // Test if a user is currently authenticated
  function isAuthenticated() {
    return !!self.user;
  }

  // Return the current user
  function currentUser() {
    return self.user;
  }

    function sync() {
    var session = JWT.remember();
    self.user = session && session.claim && session.claim.user;
  }
    }
    /* END : LoginService function */
  }
});