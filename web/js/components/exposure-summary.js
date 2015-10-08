define(['knockout', 'text!./exposure-summary.html','d3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function exposureSummary(params) {
		var self = this;
		self.model = params.model;
		self.datatables = {};
        self.loading = ko.observable(false);
        self.loadingReportDrilldown = ko.observable(false);
        self.activeReportDrilldown = ko.observable(false);
        
        self.render = function() {
        	self.loading(true);
			$.ajax({
				type: "GET",
                url: self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/' + self.model.currentCohortId() + '/cohortspecifictreemap',
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    // Remove the loading dialog
                    self.loading(false);

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
                                    risk_difference: self.model.formatFixed(this.riskDiffAfterBefore[i])
                                };
                            }, conditionOccurrencePrevalence);

                            $(document).on('click', '.treemap_table tbody tr', function () {
                                var datatable = self.datatables[$(this).parents('.treemap_table').attr('id')];
                                var data = datatable.data()[datatable.row(this)[0]];
                                if (data) {
                                    var did = data.concept_id;
                                    var concept_name = data.name;
                                    self.drilldown(did, concept_name, $(this).parents('.treemap_table').attr('type'));
                                }
                            });

                            datatable = $('#condition_table').DataTable({
                                order: [6, 'desc'],
                                dom: 'T<"clear">lfrtip',
                                data: table_data,
                                columns: [{
                                        data: 'concept_id'
                            },
                                    {
                                        data: 'soc'
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
                                        data: 'snomed'
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
                                pageLength: 5,
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
                    }                    
				}
			});
        }

        self.drilldown = function (id, name, type) {
			self.loadingReportDrilldown(true);
			self.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/' + self.model.currentCohortId() + '/cohortspecific' + type + "/" + id,
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

					var scatter = new jnj_chart.scatterplot();
					self.activeReportDrilldown(true);
					$('#' + type + 'DrilldownScatterplotHeading').html(name);

					scatter.render(totalRecordsData, "#" + type + "DrilldownScatterplot", 460, 150, {
						yFormat: d3.format('0.2%'),
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

        self.render()
	}
    

	var component = {
		viewModel: exposureSummary,
		template: view
	};

	ko.components.register('exposure-summary', component);
	return component;
});