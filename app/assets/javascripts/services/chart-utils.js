(function() {
    "use strict";

    var module = angular.module('tk.chart.utils', []);

    module.factory('ChartUtils', [
        function(){
            var factory = {};

            factory.buildPerfLineChart = function(report){
                var line = {
                    options: {
                        responsive : true
                    }
                };
                line.labels = getResultTrendLabels(report.testPlan, report.history);
                line.series = ['Execution Time'];
                line.colours = ["#d0e9c6", "#ebcccc", "#FDB45C", "#00ADF9"];
                line.data = getPerfTrendData(report.testPlan, report.history)
                return line;

            };

            factory.buildLineChart = function(report){
                var line = {
                    options: {
                        responsive : true
                    }
                };
                line.labels = getResultTrendLabels(report.testPlan, report.history);
                line.series = ['OK', 'KO', 'Not Completed', 'Not Run'];
                line.colours = ["#d0e9c6", "#ebcccc", "#FDB45C", "#00ADF9"];
                line.data = getResultTrendData(report.testPlan, report.history)
                return line;
            };

            factory.buildPieChart = function(report){
                var pie = {
                    options: {
                        responsive : true
                    }
                }
                pie.labels = ['OK', 'KO'];
                pie.colours = ["#d0e9c6", "#ebcccc"];
                pie.data = [getTotalOk(report.testPlan),
                            getTotalKo(report.testPlan)];
                return pie;
            }

            factory.isSuccess = function (testPage) {
                return (testPage.technicalErrorNumber + testPage.testFailureNumber) == 0;
            }

            function getResultTrendLabels(testPlan, history) {
                var array = new Array(history.length + 1);
                for(var i=0; i < history.length; i++) {
                    array[i] =  "Run " + history[i].iterations;
                }
                array[i] = "Run " + testPlan.iterations;

                return array;
            }

            function getPerfTrendData(testPlan, history) {
                var array = new Array(history.length + 1);
                for(var i=0; i < history.length; i++) {
                    array[i] = getTotalExecutionTime(history[i]);
                }
                array[i] = getTotalExecutionTime(testPlan);
                return array;
            }

            function getTotalExecutionTime(testPlan){
                var total = 0;
                for(var i=0; i < testPlan.campaigns.length; i++) {
                    var campaign = testPlan.campaigns[i];
                    for(var j=0; j < campaign.scenarii.length; j++) {
                        total = total + campaign.scenarii[j].executionTime;
                    }
                }
                return total;
            }

            function getResultTrendData(testPlan, history) {
                var array = new Array(history.length + 1);
                var projectIndex = 0;
                for(var i=0; i < history.length; i++) {
                    majTrendData(array, projectIndex, history[i]);
                    projectIndex++;
                }
                majTrendData(array, projectIndex, testPlan);

                var out = new Array(4);
                for (var i=0; i< 4; i++){
                    var serie = new Array(array.length);
                    for (var j = 0; j< array.length; j++){
                        serie[j] = array[j][i];
                    }
                    out[i] = serie;
                }

                return out;
            }

            function majTrendData(inputArray, index, testPlan) {
                var array = new Array(4);
                array[0] = getTotalOk(testPlan);
                array[1] = getTotalKo(testPlan);
                array[2] = 0.0;
                array[3] = 0.0;
                inputArray[index] = array;
            }

            factory.getCampaignTotalOk = function (campaign){
                var total = 0;
                for(var j=0; j < campaign.scenarii.length; j++) {
                    if(factory.isSuccess(campaign.scenarii[j])) {
                        ++total;
                    }
                }
                return total;
            }

            factory.getCampaignTotalKo = function(campaign){
                var total = 0;
                for(var j=0; j < campaign.scenarii.length; j++) {
                    if(!factory.isSuccess(campaign.scenarii[j])) {
                        ++total;
                    }
                }
                return total;
            }


            function getTotalOk(testPlan) {
                var total = 0;
                for(var i=0; i < testPlan.campaigns.length; i++) {
                    total = total + factory.getCampaignTotalOk(testPlan.campaigns[i]);
                }
                return total;
            }

            function getTotalKo(testPlan) {
                var total = 0;
                for(var i=0; i < testPlan.campaigns.length; i++) {
                    total = total + factory.getCampaignTotalKo(testPlan.campaigns[i]);
                }
                return total;
            }

            return factory;
        }]);
})();