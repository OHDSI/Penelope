define([
	'jquery',
	'knockout',
    'jnj_chart',
    'd3',
	'components/webapi-configuration',
	'bootstrap',
    'facets',
    'databindings',
    'colvis',
    'extenders'
], function ($, ko, jnj_chart, d3) {

	var appModel = function () {
        var self = this;

		self.appInitializationFailed = ko.observable(false);
        self.initPromises = [];

        // Example model settings
		self.appHeading = ko.observable('Welcome to Penelope');
		self.appBody = ko.observable('Personalized Exploratory Navigation and Evaluation for Labels Of Product Effects');

        // Selected Drug settings
        self.currentExposureCohortId = ko.observable();
        self.currentExposureCohortName = ko.observable();
        self.currentDrugSetId = ko.observable();
        self.currentDrugConceptId = ko.observable(0);
        self.currentDrugName = ko.observable();
        self.currentDrugLabel = ko.observable();
        self.currentDrugLabelTOC = ko.observable();
        
        // Search settings
        self.currentView = ko.observable('home');
        self.currentSearch = ko.observable();
        //self.currentLabel = ko.observable();
        self.recentSearch = ko.observableArray(null);
        self.searchResultsConcepts = ko.observableArray();
                
        // Drug Label settings
        self.selectedConditionConceptId = ko.observable(0);
        self.selectedConditionConceptName = ko.observable('');
        self.selectedConditionConceptAndDescendants = ko.observableArray(null);
        self.selectedConditionOccurrencePrevalence = ko.observable();
        self.selectedConditionCohorts = ko.observableArray(null);
        self.selectedDrugAndAncestorDescendants = ko.observableArray(null);
        self.drugLabelActiveTab = ko.observable('obs'); // Observational Evidence is the default
        self.productLabelSectionHeadings = ko.observableArray(null);
        
        // Literature Evidence Settings
        self.literatureEvidenceSummary = ko.observableArray(null);
        self.literatureEvidenceDetails = ko.observableArray(null);
        
        // OpenFDA Settings
        self.openFDAConditionOccurrenceForLabel = ko.observable();
        
        self.initComplete = function () {
            self.router.init('/');
        }

		// configure services to include at least one valid OHDSI WebAPI endpoint
		self.services = ko.observableArray([
			{
				name: 'Local',
				url: 'http://localhost:8080/WebAPI/',
				dialect: ko.observable('loading'),
				version: ko.observable('loading'),
                atlas: 'http://hixbeta.jnj.com/atlas',
                circe: 'http://hixbeta.jnj.com/circe'
			}
            /*,
			{
				name: 'Hixbeta',
				url: 'http://hixbeta.jnj.com:8081/WebAPI/',
				dialect: ko.observable('loading'),
				version: ko.observable('loading'),
                atlas: 'http://hixbeta.jnj.com/atlas',
                circe: 'http://hixbeta.jnj.com/circe'
			}*/
		]);
        self.sources = ko.observableArray().extend({ localStoragePersist: ['sources', '30']});
        self.reportSourceKey = ko.observable().extend({ localStoragePersist: ['reportSourceKey', '30']});
		self.vocabularyUrl = ko.observable().extend({ localStoragePersist: ['vocabularyUrl', '30']});
		self.evidenceUrl = ko.observable().extend({ localStoragePersist: ['evidenceUrl', '30']});
		self.resultsUrl = ko.observable();

        self.hasResults = function (source) {
			for (var d = 0; d < source.daimons.length; d++) {
				if (source.daimons[d].daimonType == 'Results') {
					return true;
				}
			}
			return false;
		}
                
		self.search = function (query) {
			self.currentView('loading');

			filters = [];
			$('#querytext').blur();
    
			$.ajax({
				url: 'js/mock-data/search-results.json', //self.vocabularyUrl() + 'search/' + query,
				success: function (results) {
					if (results.length == 0) {
						self.currentView('search');
						$('#modalNoSearchResults').modal('show');
						return;
					}

					//var densityPromise = self.loadDensity(results);

					//$.when(densityPromise).done(function () {
						var tempCaption;

						if (decodeURI(query).length > 20) {
							tempCaption = decodeURI(query).substring(0, 20) + '...';
						} else {
							tempCaption = decodeURI(query);
						}

						lastQuery = {
							query: query,
							caption: tempCaption,
							resultLength: results.length
						};
						self.currentSearch(query);

						var exists = false;
						for (var i = 0; i < self.recentSearch().length; i++) {
							if (self.recentSearch()[i].query == query)
								exists = true;
						}
						if (!exists) {
							self.recentSearch.unshift(lastQuery);
						}
						if (self.recentSearch().length > 7) {
							self.recentSearch.pop();
						}

						self.currentView('searchResults');
						self.searchResultsConcepts(results);
					//});
				},
				error: function (xhr, message) {
					alert('error while searching ' + message);
				}
			});
		} 
        
        self.displayLabel = function (setid){
            self.currentView('loading');
            
            // Get the current drug by setid - first by
            // interrogating the search results and if it is 
            // not there, go back to the server.
            var selectedDrug = ko.utils.arrayFirst(self.searchResultsConcepts(), function (item) { 
                return item.set_id == setid;
            });
            
            // TODO - Call the WS to get the current drug selected. For now, fake it out
            if (selectedDrug == null) {
                // Reset the selected concept id and information
                self.selectedConditionConceptId(0);
                self.selectedConditionConceptName('');
                $.ajax({
                    url : "js/mock-data/search-results.json", //"js/mock-data/sample-drug.json",
                    success : function(result){
                        var selectedDrugFromResults = ko.utils.arrayFirst(result, function (item) {
                            return item.set_id == setid;
                        });
                        self.getLabel(selectedDrugFromResults);
                    }
                });
            }
            else
            {
                self.getLabel(selectedDrug);
            }
        }
        
        self.getLabel = function (selectedDrug){
            if (selectedDrug != null)
            {
                self.currentDrugSetId(selectedDrug.set_id);
                self.currentDrugName(selectedDrug.drug_name);
                self.currentDrugConceptId(selectedDrug.drug_concept_id);
                self.currentExposureCohortId(selectedDrug.cohort_id);
                self.currentExposureCohortName(selectedDrug.cohort_name);
                
                $.ajax({
                    url : "js/spl/" + selectedDrug.set_id + ".html", //"js/mock-data/sample-label-lipitor.html", //"js/mock-data/sample-label.html",
                    success : function(result){
                        // Bind the result to the observable
                        self.currentDrugLabel(result);
                        // Update the view
                        self.currentView('druglabel');
                        // Build the Table of Contents from the label
                        self.buildTOCFromLabel();
                        // Remove all of the links from the drug label
                        $('#spl-display a').each(function() {
                            $(this).replaceWith($(this).html());
                        });
                        // Moddify the <SPAN> tags that are for medication as we don't handle these just yet.
                        $("#spl-display span.product-label-link").each(function() {
                            if ($(this).attr("type") == 'medication')
                                $(this).attr("class", "");
                        });
                        // Remove the links from the Indications section
                        var labelSectionPrefix = $("#spl-display div[data-sectioncode='34067-9']").children("h1").attr("id").replace("main", "");
                        $("#spl-display span.product-label-link[id*='" + labelSectionPrefix + "-']").attr("class", "");
                        // Hide the product packaging section
                        $("#spl-display div[data-sectioncode='51945-4']").attr("class", "hidden");
                    },
                    error : function(error){
                        alert('Error retrieving label: ' + error);
                    }
                });    
            } 
            else
            {
                // TODO: Display something to let the user know we couldn't find this SetID
            }
        }
        
        self.buildTOCFromLabel = function () {
            if (self.currentDrugLabel != null) {
                var sectionCodes = $("#spl-display .Contents").children("div").map(function (mainHeadingIndex, val) {
                    var mainHeading = self.getTOCMainHeading(this, mainHeadingIndex);
                    var mainHeadingHOITerms = self.getTOCHOITerms(this, "mainHeading", mainHeadingIndex, "main");
                    var subHeadings = self.getTOCSubHeading(this, mainHeadingIndex);
                    if (mainHeading.text != "")
                    {
                    	return {"mainHeading": mainHeading, "HOITerms": mainHeadingHOITerms, "subHeadings": subHeadings};
                    }
                }).get();
                
                self.currentDrugLabelTOC(sectionCodes);
            }
        }
        
        self.getTOCMainHeading = function (element, mainHeadingIndex) {
            // Get the main section headings which are tagged with an <h1> tag. 
            // Sometimes, the H1 tag will be present but will contain no text OR 
            // there will be no H1 tag present. In this instance, look for the <p> tag
            // with the class of "First" and this will be the section heading that we need.
            var name = $(element).find("h1");
            var returnVal = "";
            var id = "";
            if (name.length > 0) {
                returnVal = $(name).text();
            }
            if (name.length == 0 || returnVal == "") {
                name = $(element).find("p.First").get();
            }
            if (name.length > 0) {
                id = "main-" + mainHeadingIndex;
                $(name).attr("id", id);
                returnVal = $(name).text();
            }
            return {"text": returnVal, "id": id};
        }

        self.getTOCSubHeading = function (element, mainHeadingIndex) {
            // Get the sub section headings which are tagged with an <h2> tag. 
            var subHeadings = $(element).find("h2").map(function(subHeadingIndex, val) {
                var subHeadingText = $(this).text();
                var id = "sub-" + mainHeadingIndex + "-" + subHeadingIndex;
                $(this).attr("id", id);
                var HOITerms = self.getTOCHOITerms(this.parentElement, "subHeading", mainHeadingIndex, subHeadingIndex);
                return {"subHeading": subHeadingText, "id": id, "HOITerms": HOITerms};
            }).get();
            return subHeadings;
        }
                
        self.getTOCHOITerms = function (element, type, mainHeadingIndex, subHeadingIndex) {
            var selector = null;
            // If we are looking for HOI term in the main 
            // heading, only search in the immediate <p> tags
            if (type == "mainHeading") {
                selector = $(element).children().map (function() {
                    if ($(this).is("p")) return this;
                }).find("span.product-label-link");
            }
            else
            {
                // Find all of the product label links that reference an HOI
                selector = $(element).find("span.product-label-link");
            }
            
            // Get the HOI terms which are tagged with an <span> tag. 
            var HOITerms = jQuery.unique(selector.map(function() {
                if ($(this).attr("type") == "condition")
                {
                    var id = "hoi-" + $(this).attr("conceptid") + "-" + mainHeadingIndex + "-" + subHeadingIndex;
                    $(this).attr("id", id);
                    return {"name": $(this).text().toLowerCase(), "id": id};
                }
            }).get());
            return HOITerms;
        }
        
        self.selectedConceptsIndex = {};
        
		self.searchConceptsColumns = [
			{
				title: '',
				render: function (s, p, d) {
					var css = '';
					var icon = 'fa-shopping-cart';

					if (self.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
						css = ' selected';
					}
					return '<i class="fa ' + icon + ' ' + css + '"></i>';
				},
				orderable: false,
				searchable: false
			},
			{
				title: 'Id',
				data: 'CONCEPT_ID'
			},
			{
				title: 'Code',
				data: 'CONCEPT_CODE'
			},
			{
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: function (s, p, d) {
					var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
				},
				width: '50%'
			},
			{
				title: 'Class',
				data: 'CONCEPT_CLASS_ID'
			},
			{
				title: 'Standard Concept Caption',
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			},
			{
				title: 'Density',
				data: 'DENSITY',
				className: 'numeric'
			},
			{
				title: 'Domain',
				data: 'DOMAIN_ID'
			},
			{
				title: 'Vocabulary',
				data: 'VOCABULARY_ID',
				width: '100px'
			}
		];
		self.searchConceptsOptions = {
			Facets: [
				{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
						},
				{
					'caption': 'Class',
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
						},
				{
					'caption': 'Domain',
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
						},
				{
					'caption': 'Standard Concept',
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
						},
				{
					'caption': 'Invalid Reason',
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
						},
				{
					'caption': 'Has Data',
					'binding': function (o) {
						return o.DENSITY > 0;
					}
						}
					]
		};       
                
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

        self.formatPercent = d3.format('.2%');
        self.formatFixed = d3.format('.2f');
        self.formatComma = d3.format(',');
        
		// ATLAS - ReportManager.js common functions - END
	}

	return appModel;
});
