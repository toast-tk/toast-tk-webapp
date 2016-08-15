var jsRoutes = {}; (function(_root){
var _nS = function(c,f,b){var e=c.split(f||"."),g=b||_root,d,a;for(d=0,a=e.length;d<a;d++){g=g[e[d]]=g[e[d]]||{}}return g}
var _qS = function(items){var qs = ''; for(var i=0;i<items.length;i++) {if(items[i]) qs += (qs ? '&' : '') + items[i]}; return qs ? ('?' + qs) : ''}
var _s = function(p,s){return p+((s===true||(s&&s.secure))?'s':'')+'://'}
var _wA = function(r){return {ajax:function(c){c=c||{};c.url=r.url;c.type=r.method;return jQuery.ajax(c)}, method:r.method,type:r.method,url:r.url,absoluteURL: function(s){return _s('http',s)+'127.0.0.1:9000'+r.url},webSocketURL: function(s){return _s('ws',s)+'127.0.0.1:9000'+r.url}}}
_nS('controllers.Application'); _root.controllers.Application.login = 
        function() {
          return _wA({method:"POST", url:"/" + "login"})
        }
      
_nS('controllers.DomainController'); _root.controllers.DomainController.typeDescriptor = 
        function() {
          return _wA({method:"GET", url:"/" + "typeDescriptor"})
        }
      
_nS('controllers.ConfigurationController'); _root.controllers.ConfigurationController.saveConfiguration = 
        function() {
          return _wA({method:"POST", url:"/" + "saveConfiguration"})
        }
      
_nS('controllers.ConfigurationController'); _root.controllers.ConfigurationController.loadConfiguration = 
        function() {
          return _wA({method:"GET", url:"/" + "loadConfiguration"})
        }
      
_nS('controllers.RepositoryController'); _root.controllers.RepositoryController.saveAutoConfig = 
        function() {
          return _wA({method:"POST", url:"/" + "saveAutoSetupConfiguration"})
        }
      
_nS('controllers.RepositoryController'); _root.controllers.RepositoryController.saveServiceConfigBlock = 
        function() {
          return _wA({method:"POST", url:"/" + "saveServiceConfigBlock"})
        }
      
_nS('controllers.RepositoryController'); _root.controllers.RepositoryController.saveAutoConfigBlock = 
        function() {
          return _wA({method:"POST", url:"/" + "saveAutoConfigBlock"})
        }
      
_nS('controllers.RepositoryController'); _root.controllers.RepositoryController.loadAutoConfiguration = 
        function() {
          return _wA({method:"GET", url:"/" + "loadAutoConfiguration"})
        }
      
_nS('controllers.RepositoryController'); _root.controllers.RepositoryController.loadServiceEntityRepository = 
        function() {
          return _wA({method:"GET", url:"/" + "loadServiceEntityRepository"})
        }
      
_nS('controllers.RepositoryController'); _root.controllers.RepositoryController.loadWebPageRepository = 
        function() {
          return _wA({method:"GET", url:"/" + "loadWebPageRepository"})
        }
      
_nS('controllers.RepositoryController'); _root.controllers.RepositoryController.deleteObject = 
        function() {
          return _wA({method:"POST", url:"/" + "deleteObject"})
        }
      
_nS('controllers.Application'); _root.controllers.Application.loadCtxTagData = 
        function(itemName) {
          return _wA({method:"GET", url:"/" + "loadCtxTagData/" + (function(k,v) {return v})("itemName", encodeURIComponent(itemName))})
        }
      
_nS('controllers.Application'); _root.controllers.Application.loadAutoSetupCtx = 
        function(setupType) {
          return _wA({method:"GET", url:"/" + "loadAutoSetupCtx/" + (function(k,v) {return v})("setupType", encodeURIComponent(setupType))})
        }
      
_nS('controllers.Application'); _root.controllers.Application.loadCtxSentences = 
        function(confType) {
          return _wA({method:"GET", url:"/" + "loadCtxSentences/" + (function(k,v) {return v})("confType", encodeURIComponent(confType))})
        }
      
_nS('controllers.Application'); _root.controllers.Application.loadSentences = 
        function(confType) {
          return _wA({method:"GET", url:"/" + "loadSentences/" + (function(k,v) {return v})("confType", encodeURIComponent(confType))})
        }
      
_nS('controllers.ScenarioController'); _root.controllers.ScenarioController.loadScenarii = 
        function() {
          return _wA({method:"GET", url:"/" + "loadScenarii"})
        }
      
_nS('controllers.ScenarioController'); _root.controllers.ScenarioController.loadScenarioCtx = 
        function(scenarioType) {
          return _wA({method:"GET", url:"/" + "loadScenarioCtx/" + (function(k,v) {return v})("scenarioType", encodeURIComponent(scenarioType))})
        }
      
_nS('controllers.ScenarioController'); _root.controllers.ScenarioController.saveScenarii = 
        function() {
          return _wA({method:"POST", url:"/" + "saveScenarii"})
        }
      
_nS('controllers.ScenarioController'); _root.controllers.ScenarioController.deleteScenarii = 
        function() {
          return _wA({method:"POST", url:"/" + "deleteScenarii"})
        }
      
_nS('controllers.ProjectController'); _root.controllers.ProjectController.saveProject = 
        function() {
          return _wA({method:"POST", url:"/" + "saveProject"})
        }
      
_nS('controllers.ProjectController'); _root.controllers.ProjectController.loadProject = 
        function() {
          return _wA({method:"GET", url:"/" + "loadProject"})
        }
      
_nS('controllers.ProjectController'); _root.controllers.ProjectController.loadProjectReport = 
        function(projectName) {
          return _wA({method:"GET", url:"/" + "loadProjectReport/" + (function(k,v) {return v})("projectName", encodeURIComponent(projectName))})
        }
      
_nS('controllers.Application'); _root.controllers.Application.loadEnvConfiguration = 
        function() {
          return _wA({method:"GET", url:"/" + "loadEnvConfiguration"})
        }
      
_nS('controllers.Application'); _root.controllers.Application.logout = 
        function() {
          return _wA({method:"GET", url:"/" + "logout"})
        }
      
_nS('controllers.Users'); _root.controllers.Users.user = 
        function(id) {
          return _wA({method:"GET", url:"/" + "users/" + (function(k,v) {return v})("id", id)})
        }
      
})(jsRoutes)