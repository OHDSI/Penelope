define(['knockout', 'text!./cohorts-of-interest-scatter.html','d3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function cohortsOfInterestScatter(params) {
		var self = this;
		self.model = params.model;
		self.datatables = {};
        self.loading = ko.observable(false);
        self.loadingReportDrilldown = ko.observable(false);
        self.activeReportDrilldown = ko.observable(false);
        self.loadingPredictorsDrilldown = ko.observable(false);
        
		self.render = function () {
            self.loading(true);            
            var exposureCohortList = [self.model.currentExposureCohortId()];
            var outcomeCohortList = self.model.selectedConditionCohorts().map(function(d, i) { return d.cohortDefinitionId });
            $.ajax({
				method: 'POST',
                data: ko.toJSON({
                    "EXPOSURE_COHORT_LIST" : [self.model.currentExposureCohortId()],
                    "OUTCOME_COHORT_LIST" : outcomeCohortList
                }),
				url: self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/exposurecohortrates',
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    self.loading(false);   
                    //var normalizedData = self.model.normalizeDataframe(self.model.normalizeArray(data, true));
                    // format the return results
                    var table_data = data.map(function(d, i) {
                        var outcome_cohort_id = d.outcome_cohort_definition_id;
                        var condition_cohort_name = $.grep(self.model.selectedConditionCohorts(), function(n, i) {
                            return n.cohortDefinitionId == outcome_cohort_id;
                        });
                        if (condition_cohort_name.length > 0){
                            return {
                                "exposure_cohort_definition_id": d.exposure_cohort_definition_id,
                                "exposure_cohort_name": self.model.currentExposureCohortName(),
                                "outcome_cohort_definition_id": d.outcome_cohort_definition_id,
                                "outcome_cohort_name": condition_cohort_name[0].cohortDefinitionName,
                                "num_persons_exposed": self.model.formatComma(d.num_persons_exposed),
                                "num_persons_w_outcome_pre_exposure": self.model.formatComma(d.num_persons_w_outcome_pre_exposure),
                                "num_persons_w_outcome_post_exposure": self.model.formatComma(d.num_persons_w_outcome_post_exposure),
                                "time_at_risk": self.model.formatComma(d.time_at_risk),
                                "incidence_rate_1000py": self.model.formatFixed(d.incidence_rate_1000py)
                            }
                        }
                    });
                    
					// Remove the NULL values from the subset
					var table_data = $.grep(table_data, function(n, i) {
						return n != null
					});
                    
                    // Set the callback click event for the table row
                    $(document).on('click', '.cohorts_of_interest_scatter_table tbody tr', function () {
                        var datatable = self.datatables[$(this).parents('.cohorts_of_interest_scatter_table').attr('id')];
                        var data = datatable.data()[datatable.row(this)[0]];
                        if (data) {
                            var did = data.outcome_cohort_definition_id;
                            var cohort_name = data.outcome_cohort_name;
                            self.drilldown(did, cohort_name, $(this).parents('.cohorts_of_interest_scatter_table').attr('type'));
                        }
                    });

                    // Show the subset of the overall cohort conditions in this section.
					var datatable = $('#cohorts_of_interest_scatter_table').DataTable({
							order: [6, 'desc'],
							dom: 'T<"clear">lfrtip',
							data: table_data,
							columns: [{
									data: 'exposure_cohort_definition_id',
									visible: false
								},
								{
									data: 'exposure_cohort_name',
									visible: false
								},
								{
									data: 'outcome_cohort_definition_id',
									visible: false
								},
								{
									data: 'outcome_cohort_name',
									"fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
										$(nTd).html("<a target='_blank' href='" + self.model.services()[0].circe + "/#/"+oData.outcome_cohort_definition_id+"'>"+oData.outcome_cohort_name+"</a>")
									}
								},
								{
									data: 'num_persons_exposed',
									className: 'numeric'
								},
								{
									data: 'num_persons_w_outcome_pre_exposure',
									className: 'numeric'
								},
								{
									data: 'num_persons_w_outcome_post_exposure',
									className: 'numeric'
								},
								{
									data: 'time_at_risk',
									className: 'numeric'
								},
								{
									data: 'incidence_rate_1000py',
									className: 'numeric'
								}
							],
							pageLength: 10,
							lengthChange: false,
							deferRender: true,
							destroy: true
						});                    	
				    self.datatables['cohorts_of_interest_scatter_table'] = datatable;    
                }
            });            
		}

        self.drilldown = function (id, name, type) {
			self.loadingReportDrilldown(true);
			self.activeReportDrilldown(false);
            self.loadingPredictorsDrilldown(true);
            var exposureCohortList = [self.model.currentExposureCohortId()];
			var outcomeCohortList = [id];
            
            $.ajax({
				method: 'POST',
                data: ko.toJSON({
                    "EXPOSURE_COHORT_LIST" : exposureCohortList,
                    "OUTCOME_COHORT_LIST" : outcomeCohortList
                }),
				url: self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/timetoevent',
				contentType: "application/json; charset=utf-8"
			}).done(function (result) {
				if (result && result.length > 0) {
					$("#cohortOfInterestDrilldownScatterplot").empty();
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
					$('#cohortOfInterestDrilldownScatterplotHeading').html(name);

					scatter.render(totalRecordsData, "#cohortOfInterestDrilldownScatterplot", 460, 150, {
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

        self.model.currentExposureCohortId.subscribe(function(newValue) {
        	if (newValue > 0) {
				self.evaluateRender();        		
        	}
        });
        
        self.model.selectedConditionConceptId.subscribe(function(newValue) {
        	if (newValue > 0) {
				self.evaluateRender();        		
        	}
        });
        
        self.model.selectedConditionCohorts.subscribe(function(newValue) {
        	if (newValue != undefined) {        		
				self.evaluateRender();            
        	}
        });

        self.model.reportSourceKey.subscribe(function(newValue) {
            if (newValue != undefined) {
                self.render();
            }
        });        

        self.evaluateRender = function() {
            try
            {
                if (self.model.currentExposureCohortId() > 0 && self.model.selectedConditionConceptId() > 0 && self.model.selectedConditionCohorts().length > 0){
                    self.render();
                }
                else{
                    self.loading(true);
                }                
            }
            catch (e)
            {
                self.loading(true);
            }

        }
	}

	var component = {
		viewModel: cohortsOfInterestScatter,
		template: view
	};

	ko.components.register('cohorts-of-interest-scatter', component);
	return component;
});
