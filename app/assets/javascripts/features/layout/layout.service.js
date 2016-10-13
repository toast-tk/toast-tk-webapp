define(["angular"], function (angular) {
  "use strict";
  return {
    LayoutService: function ($timeout) {
      var self = this ;

      return {
        reAdjustContentSize : reAdjustContentSize,
      }

      /* BEGIN  : reAdjustContentSize */
      function reAdjustContentSize(){
          $timeout(function(){
              var effectContentWidth = window.innerWidth - angular.element('#side-nav').width();
              $timeout(function(){
                  $$("contentWebixLayout").adjust();
              },0);
              return effectContentWidth ;
          },0);
      }
      /* END : reAdjustContentSize */


    }
    /* END : LayoutService function */
  }
});