define(["angular","jwtClient"], function (angular, JWT) {
    "use strict";
    return {
        LoginService: ["$state","playRoutes", "ClientService", function ($state, playRoutes, ClientService) {
            var self = this ;
            self.user = null;
            self.project = null;

            return {
                login: login,
                logout: logout,
                isAuthenticated: isAuthenticated,
                currentUser: currentUser,
                setUserProject: setUserProject,
                hasDefaultProject: hasDefaultProject,
                getDefaultProjectId: getDefaultProjectId,
                getUserProject: getUserProject,
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
                }).then(function(response) {
                    console.log("login unexpected problem ", response);
                });
            }

            function logout() {
                playRoutes.controllers.UserController.logout(self.user._id).get().then(function (response) {
                    JWT.forget();
                    sync();
                    $state.go("login");
                });
            }

            // Test if a user is currently authenticated
            function isAuthenticated() {
                return !!currentUser();
            }

            // Test if a user has a default project defined
            function hasDefaultProject() {
                sync();
                return self.user.idProject !== null && angular.isDefined(self.user.idProject);
            }

            // Return the current user
            function currentUser() {
                sync();
                return self.user;
            }

            function getDefaultProjectId(){
                sync();
                return self.user.idProject;
            }

            function setUserProject(idProject){
                if(this.isAuthenticated()){
                    var userCopy = angular.copy(self.user);
                    userCopy.idProject = idProject;
                    var promise = playRoutes.controllers.UserController.saveUser().post(userCopy).then(function(response){
                        var savedUser = response.data;
                        var newSession = JWT.remember();
                        newSession.claim.user = savedUser;
                        JWT.keep(newSession);
                        sync();
                    });
                    return promise;
                }
            }

            function getUserProject(idProject){
                if(this.isAuthenticated() === true && this.hasDefaultProject()){
                    var promise = playRoutes.controllers.ProjectController.getProject(idProject).get().then(function(response){
                        self.project = response.data;
                        return self.project;
                    });
                    return promise;
                }
            }

            function sync() {
                var session = JWT.remember();
                self.user = session && session.claim && session.claim.user;
                if(self.user){
                    ClientService.opensocket(self.user.token)
                }
            }
        }]
        /* END : LoginService function */
    }
});