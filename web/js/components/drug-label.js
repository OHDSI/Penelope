define(['knockout', 'text!./drug-label.html', 'd3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding', 'jquery', 'jquery-ui'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function drugLabel(params) {
		var self = this;
		self.model = params.model;

		self.openEvidenceBrowser = function () {
          $.ajax({
				method: 'GET',
				url: 'js/mock-data/search-results.json', //self.model.services()[0].url + 'conceptset/',
				dataType: 'json',
				success: function (data) {
					//self.conceptSets(data);
                    $('#evidenceBrowserTabs').tabs();
					$('#evidenceExplorer').modal('show');
				}
			});
		}    
        
        self.getLiteratureSummary = function() {
            $.ajax({
				method: 'GET',
				url: 'js/mock-data/sci-lit-summary.json', //self.model.services()[0].url + 'conceptset/',
				dataType: 'json',
				success: function (data) {
                    self.model.literatureEvidenceSummary(data);
                    //self.model.literatureEvidenceResults(data);
                    $('#literature').accordion({heightStyle: "content"});
				}
			});
        }
        
        self.testReportClick = function() {
            $.ajax({
                url: "http://hixbeta.jnj.com:8081/WebAPI/OPTUM/cohortresults/121/person", // self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/' + self.model.reportCohortDefinitionId() + '/person',
                success: function (data) {
                    //self.model.currentReport(self.model.reportReportName());
                    //self.model.loadingReport(false);

                    if (data.yearOfBirth.length > 0 && data.yearOfBirthStats.length > 0) {
                        var yearHistogram = new jnj_chart.histogram();
                        var histData = {};
                        histData.intervalSize = 1;
                        histData.min = data.yearOfBirthStats[0].minValue;
                        histData.max = data.yearOfBirthStats[0].maxValue;
                        histData.intervals = 100;
                        histData.data = (self.normalizeArray(data.yearOfBirth));
                        yearHistogram.render(self.mapHistogram(histData), "#reportPerson #hist", 460, 195, {
                            xFormat: d3.format('d'),
                            xLabel: 'Year',
                            yLabel: 'People'
                        });
                    }

                    var genderDonut = new jnj_chart.donut();
                    genderDonut.render(self.mapConceptData(data.gender), "#reportPerson #gender", 260, 130, {
                        colors: d3.scale.ordinal()
                            .domain([8507, 8551, 8532])
                            .range(["#1F78B4", "#33A02C", "#FB9A99"]),
                        margin: {
                            top: 5,
                            bottom: 10,
                            right: 150,
                            left: 10
                        }

                    });

                    var raceDonut = new jnj_chart.donut();
                    raceDonut.render(self.mapConceptData(data.race), "#reportPerson #race", 260, 130, {
                        margin: {
                            top: 5,
                            bottom: 10,
                            right: 150,
                            left: 10
                        },
                        colors: d3.scale.ordinal()
                            .domain(data.race)
                            .range(colorbrewer.Paired[10])
                    });

                    var ethnicityDonut = new jnj_chart.donut();
                    ethnicityDonut.render(self.mapConceptData(data.ethnicity), "#reportPerson #ethnicity", 260, 130, {
                        margin: {
                            top: 5,
                            bottom: 10,
                            right: 150,
                            left: 10
                        },
                        colors: d3.scale.ordinal()
                            .domain(data.ethnicity)
                            .range(colorbrewer.Paired[10])
                    });
                    self.model.loadingReport(false);
                }
            });
        }

/*
        self.getLiteratureSummary = function() {
            var litSummary = $.ajax({
                        method: 'GET',
                        url: 'js/mock-data/sci-lit-summary.json', //self.model.services()[0].url + 'conceptset/',
                        dataType: 'json',
                        async: false
                    }).responseText;
            
            self.model.literatureEvidenceSummary(litSummary);

                // For the first data element, get the details. Talk to FD about how to clean this up
             var litDetails = $.ajax({
                    method: 'GET',
                    url: 'js/mock-data/sci-lit-details.json', //self.model.services()[0].url + 'conceptset/',
                    dataType: 'json',
                    async: false
                }).responseText;
            
            $('#literature').accordion({heightStyle: "content"});
        }
        
        self.getLiteratureSummaryFromService = function() {
            $.ajax({
				method: 'GET',
				url: 'js/mock-data/sci-lit-summary.json', //self.model.services()[0].url + 'conceptset/',
				dataType: 'json',
				success: function (data) {
                    self.model.literatureEvidenceSummary(data);
				}
			});            
        }
*/
        
        self.getSpontaneousReportsSummary = function() {
            alert('Spontaneous Report Summary Call');
        }
        
        self.productLabelLinkClick = function(item, event) {
            self.model.selectedConditionConceptId(event.target.attributes["conceptid"].value);
            self.model.selectedConditionConceptName(event.target.attributes["conceptname"].value);
            self.openEvidenceBrowser();
        }        
        
        self.drugLabelPostProcessingLogic = function(elements){
            alert('got here');
        }

		// ATLAS - ReportManager.js common functions - START

		self.buildHierarchyFromJSON = function (data, threshold) {
			var total = 0;

			var root = {
				"name": "root",
				"children": []
			};

			for (var i = 0; i < data.percentPersons.length; i++) {
				total += data.percentPersons[i];
			}

			for (var i = 0; i < data.conceptPath.length; i++) {
				var parts = data.conceptPath[i].split("||");
				var currentNode = root;
				for (var j = 0; j < parts.length; j++) {
					var children = currentNode.children;
					var nodeName = parts[j];
					var childNode;
					if (j + 1 < parts.length) {
						// Not yet at the end of the path; move down the tree.
						var foundChild = false;
						for (var k = 0; k < children.length; k++) {
							if (children[k].name === nodeName) {
								childNode = children[k];
								foundChild = true;
								break;
							}
						}
						// If we don't already have a child node for this branch, create it.
						if (!foundChild) {
							childNode = {
								"name": nodeName,
								"children": []
							};
							children.push(childNode);
						}
						currentNode = childNode;
					} else {
						// Reached the end of the path; create a leaf node.
						childNode = {
							"name": nodeName,
							"num_persons": data.numPersons[i],
							"id": data.conceptId[i],
							"path": data.conceptPath[i],
							"pct_persons": data.percentPersons[i],
							"records_per_person": data.recordsPerPerson[i],
							"relative_risk": data.logRRAfterBefore[i],
							"pct_persons_after": data.percentPersonsAfter[i],
							"pct_persons_before": data.percentPersonsBefore[i],
							"risk_difference": data.riskDiffAfterBefore[i]
						};

						if ((data.percentPersons[i] / total) > threshold) {
							children.push(childNode);
						}
					}
				}
			}
			return root;
		}

		self.mapConceptData = function (data) {
			var result;

			if (data instanceof Array) {
				result = [];
				$.each(data, function () {
					var datum = {}
					datum.id = (+this.conceptId || this.conceptName);
					datum.label = this.conceptName;
					datum.value = +this.countValue;
					result.push(datum);
				});
			} else if (data.countValue instanceof Array) // multiple rows, each value of each column is in the indexed properties.
			{
				result = data.countValue.map(function (d, i) {
					var datum = {}
					datum.id = (this.conceptId || this.conceptName)[i];
					datum.label = this.conceptName[i];
					datum.value = this.countValue[i];
					return datum;
				}, data);


			} else // the dataset is a single value result, so the properties are not arrays.
			{
				result = [
					{
						id: data.conceptId,
						label: data.conceptName,
						value: data.countValue
			}];
			}

			result = result.sort(function (a, b) {
				return b.label < a.label ? 1 : -1;
			});

			return result;
		}

		self.mapHistogram = function (histogramData) {
			// result is an array of arrays, each element in the array is another array containing information about each bar of the histogram.
			var result = new Array();
			if (!histogramData.data || histogramData.data.empty) {
				return result;
			}
			var minValue = histogramData.min;
			var intervalSize = histogramData.intervalSize;

			for (var i = 0; i <= histogramData.intervals; i++) {
				var target = new Object();
				target.x = minValue + 1.0 * i * intervalSize;
				target.dx = intervalSize;
				target.y = histogramData.data.countValue[histogramData.data.intervalIndex.indexOf(i)] || 0;
				result.push(target);
			};

			return result;
		}

		self.map30DayDataToSeries = function (data, options) {
			var defaults = {
				dateField: "x",
				yValue: "y",
				yPercent: "p"
			};

			var options = $.extend({}, defaults, options);

			var series = {};
			series.name = "All Time";
			series.values = [];
			if (data && !data.empty) {
				for (var i = 0; i < data[options.dateField].length; i++) {
					series.values.push({
						xValue: data[options.dateField][i],
						yValue: data[options.yValue][i],
						yPercent: data[options.yPercent][i]
					});
				}
				series.values.sort(function (a, b) {
					return a.xValue - b.xValue;
				});
			}
			return [series]; // return series wrapped in an array
		}

		self.mapMonthYearDataToSeries = function (data, options) {
			var defaults = {
				dateField: "x",
				yValue: "y",
				yPercent: "p"
			};

			var options = $.extend({}, defaults, options);

			var series = {};
			series.name = "All Time";
			series.values = [];
			if (data && !data.empty) {
				for (var i = 0; i < data[options.dateField].length; i++) {
					var dateInt = data[options.dateField][i];
					series.values.push({
						xValue: new Date(Math.floor(data[options.dateField][i] / 100), (data[options.dateField][i] % 100) - 1, 1),
						yValue: data[options.yValue][i],
						yPercent: data[options.yPercent][i]
					});
				}
				series.values.sort(function (a, b) {
					return a.xValue - b.xValue;
				});
			}
			return [series]; // return series wrapped in an array
		}

		self.mapMonthYearDataToSeriesByYear = function (data, options) {
			// map data in the format yyyymm into a series for each year, and a value for each month index (1-12)
			var defaults = {
				dateField: "x",
				yValue: "y",
				yPercent: "p"
			};

			var options = $.extend({}, defaults, options);

			// this function takes month/year histogram data from Achilles and converts it into a multi-series line plot
			var series = [];
			var seriesMap = {};

			for (var i = 0; i < data[options.dateField].length; i++) {
				var targetSeries = seriesMap[Math.floor(data[options.dateField][i] / 100)];
				if (!targetSeries) {
					targetSeries = {
						name: (Math.floor(data[options.dateField][i] / 100)),
						values: []
					};
					seriesMap[targetSeries.name] = targetSeries;
					series.push(targetSeries);
				}
				targetSeries.values.push({
					xValue: data[options.dateField][i] % 100,
					yValue: data[options.yValue][i],
					yPercent: data[options.yPercent][i]
				});
			}
			series.forEach(function (d) {
				d.values.sort(function (a, b) {
					return a.xValue - b.xValue;
				});
			});
			return series;
		}

		self.dataframeToArray = function (dataframe) {
			// dataframes from R serialize into an obect where each column is an array of values.
			var keys = d3.keys(dataframe);
			var result;
			if (dataframe[keys[0]] instanceof Array) {
				result = dataframe[keys[0]].map(function (d, i) {
					var item = {};
					var container = this;
					keys.forEach(function (p) {
						item[p] = container[p][i];
					});
					return item;
				}, dataframe);
			} else {
				result = [dataframe];
			}
			return result;
		}

		self.normalizeDataframe = function (dataframe) {
			// rjson serializes dataframes with 1 row as single element properties.  This function ensures fields are always arrays.
			var keys = d3.keys(dataframe);
			keys.forEach(function (key) {
				if (!(dataframe[key] instanceof Array)) {
					dataframe[key] = [dataframe[key]];
				}
			});
			return dataframe;
		}

		self.normalizeArray = function (ary, numerify) {
			var obj = {};
			var keys;

			if (ary && ary.length > 0 && ary instanceof Array) {
				keys = d3.keys(ary[0]);

				$.each(keys, function () {
					obj[this] = [];
				});

				$.each(ary, function () {
					var thisAryObj = this;
					$.each(keys, function () {
						var val = thisAryObj[this];
						if (numerify) {
							if (_.isFinite(+val)) {
								val = (+val);
							}
						}
						obj[this].push(val);
					});
				});
			} else {
				obj.empty = true;
			}

			return obj;
		}

		self.boxplotHelper = function (data, target, width, height, xlabel, ylabel) {
			var boxplot = new jnj_chart.boxplot();
			var yMax = 0;
			var bpseries = [];
			data = self.normalizeArray(data);
			if (!data.empty) {
				var bpdata = self.normalizeDataframe(data);

				for (var i = 0; i < bpdata.category.length; i++) {
					bpseries.push({
						Category: bpdata.category[i],
						min: bpdata.minValue[i],
						max: bpdata.maxValue[i],
						median: bpdata.medianValue[i],
						LIF: bpdata.p10Value[i],
						q1: bpdata.p25Value[i],
						q3: bpdata.p75Value[i],
						UIF: bpdata.p90Value[i]
					});
					yMax = Math.max(yMax, bpdata.p90Value[i]);
				}

				boxplot.render(bpseries, target, width, height, {
					yMax: yMax,
					xLabel: xlabel,
					yLabel: ylabel
				});
			}
		}

		// ATLAS - ReportManager.js common functions - END
    }

	var component = {
		viewModel: drugLabel,
		template: view
	};

	ko.components.register('drug-label', component);
	return component;
});
