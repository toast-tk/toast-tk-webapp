(function() {
    'use strict';

    angular.module('pw-fsexplorer', ["template/explorerTpl.html"])
        .constant('fsConfig', {
            templateUrl: null,
            options : {
                nodeId: "id",
                parentNodeRef: "parent",
                sortBy: 'name',
                searchBy: {},
                isGlobalSearch : true,
                selectedNode: null,
                isAccessibleNode: function(node){
                    return true;
                }
            }
        })
        .directive('pwFsexplorer', function($compile, $filter, $templateCache, fsExplorerService, fsConfig, $http) {
            return {
                restrict: 'EA',
                transclude: true,
                scope: {
                    explorerModel: "=",
                    explorerOptions: "=",
                    templateUrl:"=",
                    onNodeClick:"=",
                    onPathChange:"=",
                    isClickable:"="
                },
                link: function($scope, element, attrs, ctrl, transclude){
                    if($scope.templateUrl != null){
                        $http.get($scope.templateUrl).then(function(response) {
                            $templateCache.put("template/explorerTpl.html", response.data);
                            compile($templateCache.get("template/explorerTpl.html"));
                        });
                    } else{
                        compile($templateCache.get("template/explorerTpl.html"));

                    }
                    function compile(template){
                        $compile(template)($scope, function(_element,_scope) {
                            element.replaceWith(_element);
                            element = _element ;
                        });
                    }

                    transclude($scope, function(clone, scope) {
                        scope.transcludedElement = angular.element('<div></div>').append(clone).html();
                    });
                },
                controller: function($scope){
                    var context = {
                        selectedNode: null,
                        clickedNode: null,
                        currentPath:[]
                    };
                    if($scope.explorerOptions) {
                        for (var prop in $scope.explorerOptions) {
                            fsConfig.options[prop] = $scope.explorerOptions[prop];
                        }
                    }

                    function refreshExplorer(){
                        if(context.currentPath.length>0){
                            $scope.nodeList = $filter('orderBy')(fsExplorerService.getChildrenNodeList(explorerModel,context.currentPath[context.currentPath.length - 1]), fsConfig.options.sortBy);
                        } else {
                            $scope.nodeList = $filter('orderBy')(fsExplorerService.getRootNodeList(explorerModel), fsConfig.options.sortBy);
                        }
                    }

                    function refreshFlatExplorer(){
                        $scope.nodeList = $filter('orderBy')(explorerModel, fsConfig.options.sortBy);
                    }

                    var explorerModel = $scope.explorerModel;
                    $scope.$watch("explorerModel",function(newModel){
                        explorerModel = newModel ;
                        refreshExplorer();
                    },true);

                    $scope.nodeList = $filter('orderBy')(fsExplorerService.getRootNodeList(explorerModel), fsConfig.options.sortBy);

                    $scope.$watch("explorerOptions.selectedNode",function(newNode,oldNode){
                        fsConfig.options.selectedNode  = angular.copy(newNode);
                        if(fsConfig.options.selectedNode != null){
                            $scope.selectNodeLabel(fsConfig.options.selectedNode);
                        }
                    },true);

                    $scope.$watch(function(){
                            return {
                                by: $scope.explorerOptions.searchBy,
                                isGlobal : $scope.explorerOptions.isGlobalSearch
                            }
                        },
                        function(newSearchConf){
                            $scope.isSearchActive = (newSearchConf.by && (Object.keys(newSearchConf.by).length != 0) && (function(){
                                for (var prop in newSearchConf.by){
                                    if(newSearchConf.by[prop] != ""){
                                        return true;
                                    }
                                }
                                return false;
                            })());

                            if(Object.keys(newSearchConf.by).length != 0){
                                explorerModel = [];
                                var isEmpty = true;
                                $scope.explorerModel.forEach(function(node){
                                    var isMatching = true;
                                    for (var prop in newSearchConf.by) {
                                        if(!node[prop] || !node[prop].toString().includes(newSearchConf.by[prop])){
                                            isMatching = false;
                                        }
                                        if (newSearchConf.by[prop].toString() != ""){
                                            isEmpty = false;
                                        }
                                    }
                                    if(isMatching === true){
                                        explorerModel.push(node)
                                    }
                                });
                                if (newSearchConf.isGlobal === true && !isEmpty){
                                    refreshFlatExplorer();
                                } else {
                                    refreshExplorer();
                                }
                            }
                        },true);

                    $scope.$watch(function(){
                        return context.currentPath;
                    },function(newPath){
                        $scope.explorerOptions.selectedNode = newPath[newPath.length - 1];
                        if($scope.onPathChange){
                            $scope.onPathChange(newPath);
                        }
                    },true);

                    $scope.backToParent = function(){
                        if($scope.nodeList.length>0){
                            $scope.nodeList = $filter('orderBy')(fsExplorerService.getNodeListInParentFolder(explorerModel,$scope.nodeList[0]), fsConfig.options.sortBy);
                            if(context.currentPath.length>0){
                                context.currentPath.splice([context.currentPath.length - 1],1);
                            }
                        } else {
                            log.error("error: it should have at least pwdPointer");
                        }
                    };

                    $scope.nodeClass = function(node){
                        if(context.clickedNode && context.clickedNode[fsConfig.options.nodeId] === node[fsConfig.options.nodeId]){
                            return "clicked-node";
                        }
                    };

                    $scope.selectNodeLabel = function(node){
                        context.clickedNode = node;
                        if(angular.isUndefined($scope.isClickable)|| (angular.isDefined($scope.isClickable) && $scope.isClickable(node) === true)){
                            if(!node.__isFakeNode__ && fsConfig.options.isAccessibleNode(node)===true){
                                $scope.nodeList = $filter('orderBy')(fsExplorerService.getChildrenNodeList(explorerModel,node), fsConfig.options.sortBy);
                                context.selectedNode = node;
                                context.currentPath = fsExplorerService.getNodePath(explorerModel, node);
                            }
                            if ($scope.onNodeClick) {
                                $scope.onNodeClick(node);
                                //context.selectedNode = node;
                                //context.currentPath = fsExplorerService.getNodePath($scope.explorerModel, node);
                            }
                        }
                    }
                }
            }
        })
        .directive('pwNodeTransclude', function($compile) {
            return {
                restrict: 'EA',
                replace: true,
                template:'<div>{{nodeContent}}</div>',
                transclude: true,
                link: function($scope, $element, attrs, ctrl, transclude){
                    $scope.nodeContent = $scope.$parent.transcludedElement;
                    $compile($element.html($scope.nodeContent))($scope, function(_element,_scope) {
                        $element.replaceWith(_element);
                        $element = _element ;
                    });
                }
            }
        })
        .service('fsExplorerService', function(fsConfig) {
            return {
                getParentNode: getParentNode,
                getRootNodeList: getRootNodeList,
                getNodeListInParentFolder: getNodeListInParentFolder,
                getChildrenNodeList: getChildrenNodeList,
                getNodePath: getNodePath
            }

            function findNodeBy(NodeList,predicate){
                var found = false;
                NodeList.forEach(function(node){
                    if(function(){
                            for (var key in predicate) {
                                if (predicate.hasOwnProperty(key)) {
                                    var value = p[key];
                                    if(node[key] != value){
                                        return false;
                                    }
                                }
                            }
                            return true ;
                        })
                    {
                        return true;
                    }
                });
                return false;
            }

            function appendWithPwdPointer(NodeList, parent){
                var pwdPointer = {
                    __isFakeNode__ : true,
                    name : "."
                };
                pwdPointer[fsConfig.options.parentNodeRef] = parent;
                if(!findNodeBy(NodeList,pwdPointer)){
                    NodeList.unshift(pwdPointer);
                }
                return NodeList;
            }

            function getRootNodeList(nodeList){
                var rootNodeList = [];
                var rootDefaultParent = "0" ;
                nodeList.forEach(function(iNode){
                    if(!iNode.__isFakeNode__ && iNode[fsConfig.options.parentNodeRef].toString() === rootDefaultParent.toString()){
                        rootNodeList.push(iNode);
                    }
                });

                return appendWithPwdPointer(rootNodeList, rootDefaultParent);
            }

            function getParentNode(nodeList, node){
                if(node != null){
                    if(node[fsConfig.options.parentNodeRef].toString() != "0"){
                        var parentNode ;
                        for (var key in nodeList) {
                            if(nodeList[key][fsConfig.options.nodeId] && node[fsConfig.options.parentNodeRef].toString() === nodeList[key][fsConfig.options.nodeId].toString()){
                                return nodeList[key];
                            }
                        }
                    } else {
                        return null;
                    }
                }else{
                    return null;
                }
            }

            function getNodeListInParentFolder(nodeList, node){
                var nodeListInParentFolder = [];
                var grandParentNode = getParentNode(nodeList,getParentNode(nodeList, node)) ;
                if(grandParentNode != null){
                    return getChildrenNodeList(nodeList, grandParentNode);
                } else {
                    return getRootNodeList(nodeList);
                }
                return nodeListInParentFolder ;

            }

            function getChildrenNodeList(nodeList, node){
                var childrenNodeList = [];
                nodeList.forEach(function(iNode){
                    if(!iNode.__isFakeNode__ && iNode[fsConfig.options.parentNodeRef].toString() === node[fsConfig.options.nodeId].toString()){
                        childrenNodeList.push(iNode);
                    }
                });
                return appendWithPwdPointer(childrenNodeList,node[fsConfig.options.nodeId].toString());
            }

            function getNodePath(nodeList, node){
                var path = [];
                if(node[fsConfig.options.parentNodeRef] && node[fsConfig.options.parentNodeRef].toString() != "0"){
                    path =  getNodePath(nodeList, getParentNode(nodeList,node));
                    path.push(node);
                    return path;
                } else {
                    path.push(node);
                    return path;
                }
            };
        })

    angular.module("template/explorerTpl.html", []).run(["$templateCache", function($templateCache) {
        $templateCache.put("template/explorerTpl.html",'<ul id="pw-fsexplorer" {{options.ulClass}} >' +
            '<li ng-click="backToParent()">..</li>'+
            '<li ng-repeat="node in nodeList" ng-class="headClass(node)">' +
            '<i class="tree-branch-head" ng-class="iBranchClass()" ng-click="selectNodeHead(node)"></i>'+
            '<div class="tree-label {{options.labelClass}}" ng-click="selectNodeLabel(node)">'+
            '<pw-node-transclude></pw-node-transclude>'+
            '</div> ' +
            '</li>' +
            '</ul>');
    }]);

})();