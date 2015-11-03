define(['knockout', 'text!./exposure-summary.html','d3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding', 'colvis'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function exposureSummary(params) {
		var self = this;
		self.model = params.model;
		self.datatables = {};
        //self.loading = ko.observable(false);
        self.dataTableClickEventBound = ko.observable(false);        
        self.loadingConditionPrevalence = ko.observable(false);
        self.loadingDrugPrevalence = ko.observable(false);
        self.loadingDrugEras = ko.observable(false);
        self.loadingDrugSummary = ko.observable(false);
        self.loadingReportDrilldown = ko.observable(false);
        self.activeReportDrilldown = ko.observable(false);
        self.dataByDecile = ko.observable(null);
        self.allDeciles = ko.observable(null);
        
        self.render = function() {
            self.loadingDrugPrevalence(true);
            self.loadingDrugEras(true);
            self.loadingDrugSummary(true);
            //self.loading(true);
            
            // Get the condition prevalence
            self.renderConditionPrevalence();
                        
            // Get drug prevalance
            $.ajax({
				type: "POST",
                data: ko.toJSON({
                    "CONCEPT_ID" : self.model.currentDrugConceptId(),
                    "ANCESTOR_VOCABULARY_ID" : "ATC",
                    "ANCESTOR_CLASS_ID" : "ATC 3rd",
                    "SIBLING_VOCABULARY_ID": "RxNorm",
                    "SIBLING_CLASS_ID": "Ingredient"
                }),
                url: self.model.vocabularyUrl() + "descendantofancestor",
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    // Pass the resulting concept IDs into the drug era treemap call
                    var result = data.map(function (d, i) { return d.CONCEPT_ID });
                    $.ajax({
                        type: "POST",
                        data: ko.toJSON(result),
                        url: self.model.services()[0].url + self.model.reportSourceKey() +  '/cdmresults/drugeratreemap',
                        contentType: "application/json; charset=utf-8",
                        success: function (data) {
                            self.loadingDrugPrevalence(false);
                            self.loadingDrugSummary(false);

                            if (data && data.length > 0) {
                                //var normalizedData = self.normalizeDataFrame(data);
                                var table_data = data.map(function (d, i) {
                                    conceptDetails = d.conceptPath.split('||');
                                    return {
                                        concept_id: d.conceptId,
                                        atc1: conceptDetails[0],
                                        atc3: conceptDetails[1],
                                        atc5: conceptDetails[2],
                                        ingredient: conceptDetails[3],
                                        num_persons: self.model.formatComma(d.numPersons),
                                        percent_persons: self.model.formatPercent(d.percentPersons),
                                        length_of_era: self.model.formatFixed(d.lengthOfEra)
                                    }
                                }, data);
                                self.model.selectedDrugAndAncestorDescendants(table_data);
                                datatable = $('#drugera_table').DataTable({
                                    order: [ 5, 'desc' ],
                                    dom: 'Clfrtip',
                                    data: table_data,
                                    columns: [
                                        {
                                            data: 'concept_id',
                                            visible: false
                                        },
                                        {
                                            data: 'atc1',
                                            visible: false
                                        },
                                        {
                                            data: 'atc3',
                                            visible: false
                                        },
                                        {
                                            data: 'atc5',
                                            visible: false
                                        },
                                        {
                                            data: 'ingredient'
                                        },
                                        {
                                            data: 'num_persons',
                                            className: 'numeric'
                                        },
                                        {
                                            data: 'percent_persons',
                                            className: 'numeric'
                                        },
                                        {
                                            data: 'length_of_era',
                                            className: 'numeric'
                                        }
                                    ],
                                    pageLength: 10,
                                    lengthChange: false,
                                    deferRender: true,
                                    destroy: true
                                });
                                
                                // Pull out the current drug of interest from the 
                                var summary_table_data = $.grep(table_data, function(d, i) {
                                    return d.concept_id == self.model.currentDrugConceptId();
                                });
                                datatable = $('#drug_summary_table').DataTable({
                                    order: [ 5, 'desc' ],
                                    dom: 'Clfrtip',
                                    data: summary_table_data,
                                    columns: [
                                        {
                                            data: 'concept_id',
                                            visible: false
                                        },
                                        {
                                            data: 'atc1', 
                                            visible: false
                                        },
                                        {
                                            data: 'atc3',
                                            visible: false
                                        },
                                        {
                                            data: 'atc5',
                                            visible: false
                                        },
                                        {
                                            data: 'ingredient'
                                        },
                                        {
                                            data: 'num_persons',
                                            className: 'numeric'
                                        },
                                        {
                                            data: 'percent_persons',
                                            className: 'numeric'
                                        },
                                        {
                                            data: 'length_of_era',
                                            className: 'numeric'
                                        }
                                    ],
                                    pageLength: 10,
                                    lengthChange: false,
                                    deferRender: true,
                                    destroy: true
                                });
                            }
                        }
                    });
                }
            });            

            // Get trellis plot
            $.ajax({
				type: "GET",
                url: self.model.services()[0].url + self.model.reportSourceKey() + '/cdmresults/' + self.model.currentDrugConceptId() + '/drugeraprevalence',
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    // Remove the loading dialog
                    self.loadingDrugEras(false);
                    
                    // render trellis
                    var trellisData = self.model.normalizeArray(data, true);

                    if (!trellisData.empty) {
                        var allDeciles = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80-89", "90-99"];
                        var minYear = d3.min(trellisData.xCalendarYear),
                            maxYear = d3.max(trellisData.xCalendarYear);

                        var seriesInitializer = function (tName, sName, x, y) {
                            return {
                                trellisName: tName,
                                seriesName: sName,
                                xCalendarYear: x,
                                yPrevalence1000Pp: y
                            };
                        };

                        var nestByDecile = d3.nest()
                            .key(function (d) {
                                return d.trellisName;
                            })
                            .key(function (d) {
                                return d.seriesName;
                            })
                            .sortValues(function (a, b) {
                                return a.xCalendarYear - b.xCalendarYear;
                            });

                        // map data into chartable form
                        var normalizedSeries = trellisData.trellisName.map(function (d, i) {
                            var item = {};
                            var container = this;
                            d3.keys(container).forEach(function (p) {
                                item[p] = container[p][i];
                            });
                            return item;
                        }, trellisData);

                        var dataByDecile = nestByDecile.entries(normalizedSeries);
                        // fill in gaps
                        var yearRange = d3.range(minYear, maxYear, 1);

                        dataByDecile.forEach(function (trellis) {
                            trellis.values.forEach(function (series) {
                                series.values = yearRange.map(function (year) {
                                    var yearData = series.values.filter(function (f) {
                                        return f.xCalendarYear === year;
                                    })[0] || seriesInitializer(trellis.key, series.key, year, 0);
                                    yearData.date = new Date(year, 0, 1);
                                    return yearData;
                                });
                            });
                        });

                        self.dataByDecile(dataByDecile);
                        self.allDeciles(allDeciles);
                    }               
                }
            });            

        }
        
        self.renderConditionPrevalence = function() {
        	self.loadingConditionPrevalence(true);
            // Get Condition Prevalence
			$.ajax({
				type: "GET",
                url: self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/' + self.model.currentExposureCohortId() + '/cohortspecifictreemap',
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    // Remove the loading dialog
                    self.loadingConditionPrevalence(false);

                    // Finish the rendering now that we have data
                    var width = 1000;
                    var height = 250;
                    var minimum_area = 50;
                    var threshold = minimum_area / (width * height);
                    
                    var table_data, datatable, tree, treemap;
                    // condition prevalence
                    if (data.conditionOccurrencePrevalence) {
                        var normalizedData = self.model.normalizeDataframe(self.model.normalizeArray(data.conditionOccurrencePrevalence, true));
                        var conditionOccurrencePrevalence = normalizedData;
                        if (!conditionOccurrencePrevalence.empty) {
                            table_data = normalizedData.conceptPath.map(function (d, i) {
                                var conceptDetails = this.conceptPath[i].split('||');
                                return {
                                    concept_id: this.conceptId[i],
                                    soc: conceptDetails[0],
                                    hlgt: conceptDetails[1],
                                    hlt: conceptDetails[2],
                                    pt: conceptDetails[3],
                                    snomed: conceptDetails[4],
                                    name: conceptDetails[4],
                                    num_persons: self.model.formatComma(this.numPersons[i]),
                                    percent_persons: self.model.formatPercent(this.percentPersons[i]),
                                    relative_risk: self.model.formatFixed(this.logRRAfterBefore[i]),
                                    percent_persons_before: self.model.formatPercent(this.percentPersons[i]),
                                    percent_persons_after: self.model.formatPercent(this.percentPersons[i]),
                                    risk_difference: self.model.formatFixed(this.riskDiffAfterBefore[i]),
                                    count_value: self.model.formatComma(this.countValue[i])
                                };
                            }, conditionOccurrencePrevalence);
                            self.model.selectedConditionOccurrencePrevalence(table_data);
                            self.model.selectedConditionOccurrencePrevalenceHasData(true);
                            
                            // Get the count value for the currently selected cohort
                            self.model.currentExposureCohortCountValue(table_data[0].count_value);                            

                            datatable = $('#condition_table').DataTable({
                                order: [6, 'desc'],
                                dom: 'T<"clear">lfrtip',
                                data: table_data,
                                columns: [
                                    {
                                        data: 'snomed',
                                        "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                                            $(nTd).html("<a target='_blank' href='" + self.model.services()[0].atlas + "/#/concept/"+oData.concept_id+"'>"+oData.snomed+"</a>");
                                        }
                                    },
                                    {
                                        data: 'concept_id',
                                        visible: false
                                    },
                                    {
                                        data: 'soc',
                                        visible: false
                                    },
                                    {
                                        data: 'hlgt',
                                        visible: false
                                    },
                                    {
                                        data: 'hlt'
                                    },
                                    {
                                        data: 'pt',
                                        visible: false
                                    },
                                    {
                                        data: 'num_persons',
                                        className: 'numeric'
                                    },
                                    {
                                        data: 'percent_persons',
                                        className: 'numeric'
                                    },
                                    {
                                        data: 'relative_risk',
                                        className: 'numeric'
                                    }
                                ],
                                pageLength: 10,
                                lengthChange: false,
                                deferRender: true,
                                destroy: true
                            });
                            self.datatables['condition_table'] = datatable;

                            tree = self.model.buildHierarchyFromJSON(conditionOccurrencePrevalence, threshold);
                            treemap = new jnj_chart.treemap();
                            treemap.render(tree, '#treemap_container', width, height, {
                                onclick: function (node) {
                                    self.drilldown(node.id, node.name, 'condition');
                                },
                                getsizevalue: function (node) {
                                    return node.num_persons;
                                },
                                getcolorvalue: function (node) {
                                    return node.relative_risk;
                                },
                                getcolorrange: function () {
                                    return colorbrewer.RR[3];
                                },
                                getcolorscale: function () {
                                    return [-6, 0, 5];
                                },
                                getcontent: function (node) {
                                    var result = '',
                                        steps = node.path.split('||'),
                                        i = steps.length - 1;
                                    result += '<div class="pathleaf">' + steps[i] + '</div>';
                                    result += '<div class="pathleafstat">Prevalence: ' + self.model.formatPercent(node.pct_persons) + '</div>';
                                    result += '<div class="pathleafstat">% Persons Before: ' + self.model.formatPercent(node.pct_persons_before) + '</div>';
                                    result += '<div class="pathleafstat">% Persons After: ' + self.model.formatPercent(node.pct_persons_after) + '</div>';
                                    result += '<div class="pathleafstat">Number of People: ' + self.model.formatComma(node.num_persons) + '</div>';
                                    result += '<div class="pathleafstat">Log of Relative Risk per Person: ' + self.model.formatFixed(node.relative_risk) + '</div>';
                                    result += '<div class="pathleafstat">Difference in Risk: ' + self.model.formatFixed(node.risk_difference) + '</div>';
                                    return result;
                                },
                                gettitle: function (node) {
                                    var title = '',
                                        steps = node.path.split('||');
                                    for (var i = 0; i < steps.length - 1; i++) {
                                        title += ' <div class="pathstep">' + Array(i + 1).join('&nbsp;&nbsp') + steps[i] + ' </div>';
                                    }
                                    return title;
                                }
                            });

                            $('[data-toggle="popover"]').popover();
                        }
                        else {
                        	$('#condition_table').empty();
                            self.model.selectedConditionOccurrencePrevalence(undefined);
                            self.model.selectedConditionOccurrencePrevalenceHasData(false);
                        }
                    }                    
				}
			});            
        }
        
        self.renderTrellisPlot = function() {
            if (self.allDeciles() != null && self.dataByDecile() != null) {            	
				$("#trellisLinePlot").empty();
				// create svg with range bands based on the trellis names
				var chart = new jnj_chart.trellisline();
				chart.render(self.dataByDecile(), "#trellisLinePlot", 500, 250, {
					trellisSet: self.allDeciles(),
					trellisLabel: "Age Decile",
					seriesLabel: "Year",
					yLabel: "Prevalence Per 1000 People",
					xFormat: d3.time.format("%Y"),
					yFormat: d3.format("0.2f"),
					tickPadding: 20,
					colors: d3.scale.ordinal()
						.domain(["MALE", "FEMALE", "UNKNOWN"])
						.range(["#1F78B4", "#FB9A99", "#33A02C"])

				});
            }
        }

        self.drilldown = function (id, name, type) {
            console.log("exposure-summary-drilldown");
			self.loadingReportDrilldown(true);
			self.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/' + self.model.currentExposureCohortId() + '/cohortspecific' + type + "/" + id,
				contentType: "application/json; charset=utf-8"
			}).done(function (result) {
				if (result && result.length > 0) {
					$("#" + type + "DrilldownScatterplot").empty();
					var normalized = self.model.dataframeToArray(self.model.normalizeArray(result));

					// nest dataframe data into key->values pair
					var totalRecordsData = d3.nest()
						.key(function (d) {
							return d.recordType;
						})
						.entries(normalized)
						.map(function (d) {
							return {
								name: d.key,
								values: d.values
							};
						});

					//var scatter = new jnj_chart.scatterplot();
                    var scatter = new jnj_chart.zoomScatter();
					self.activeReportDrilldown(true);
					$('#' + type + 'DrilldownScatterplotHeading').html(name);

					scatter.render(totalRecordsData, "#" + type + "DrilldownScatterplot", 460, 150, {
						yFormat: function(d) {
					var str = d.toString();
					var idx = str.indexOf('.');
					if (idx == -1) {
						return d3.format('0%')(d);
					}

					var precision = (str.length - (idx+1) - 2).toString();
					return d3.format('0.' + precision + '%')(d);
				},
						xValue: "duration",
						yValue: "pctPersons",
						xLabel: "Duration Relative to Index",
						yLabel: "% Persons",
						seriesName: "recordType",
						showLegend: true,
						colors: d3.scale.category10(),
						tooltips: [
							{
								label: 'Series',
								accessor: function (o) {
									return o.recordType;
								}
					},
							{
								label: 'Percent Persons',
								accessor: function (o) {
									return d3.format('0.2%')(o.pctPersons);
								}
					},
							{
								label: 'Duration Relative to Index',
								accessor: function (o) {
									var years = Math.round(o.duration / 365);
									var days = o.duration % 365;
									var result = '';
									if (years != 0)
										result += years + 'y ';

									result += days + 'd'
									return result;
								}
					},
							{
								label: 'Person Count',
								accessor: function (o) {
									return o.countValue;
								}
					}
				]
					});
					self.loadingReportDrilldown(false);
				}
			});  
		}    

        self.evaluateRender = function() {
            try
            {
                // Ensure that the document level click event handler for the results table is only bound 1 time!
                if (self.dataTableClickEventBound() == false) {
                    // Set the click handler for the table
                    $(document).on('click', '.treemap_table tbody tr', function () {
                        var datatable = self.datatables[$(this).parents('.treemap_table').attr('id')];
                        var data = datatable.data()[datatable.row(this)[0]];
                        if (data) {
                            var did = data.concept_id;
                            var concept_name = data.name;
                            self.drilldown(did, concept_name, $(this).parents('.treemap_table').attr('type'));
                        }
                    });
                    
                    self.dataTableClickEventBound(true);
                }
                
                if (self.model.reportSourceKey() != undefined && self.model.currentDrugConceptId() > 0){
                    self.render();
                }
                else{
                    self.setAllToLoading();
                }                
            }
            catch (e)
            {
                self.setAllToLoading();
            }
        }
        
        self.setAllToLoading = function() {
            self.loadingConditionPrevalence = ko.observable(true);
            self.loadingDrugPrevalence = ko.observable(true);
            self.loadingDrugEras = ko.observable(true);
            self.loadingDrugSummary = ko.observable(true);            
        }

        self.model.currentDrugConceptId.subscribe(function(newValue) {
            if (newValue > 0) {
                self.render();
            }
        }); 
        
        self.model.reportSourceKey.subscribe(function(newValue) {
            if (newValue != undefined) {
                self.render();
            }
        });        
        
        /*
        self.model.currentExposureCohortId.subscribe(function(newValue) {
           self.renderConditionPrevalence();
        });
        */
        
        self.evaluateRender();
	}
    

	var component = {
		viewModel: exposureSummary,
		template: view
	};

	ko.components.register('exposure-summary', component);
	return component;
});
