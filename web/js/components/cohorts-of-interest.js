define(['knockout', 'text!./cohorts-of-interest.html','d3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function cohortsOfInterest(params) {
		var self = this;
		self.model = params.model;
		self.datatables = {};
        self.loading = ko.observable(false);
        self.loadingReportDrilldown = ko.observable(false);
        self.activeReportDrilldown = ko.observable(false);
        
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
                    
                    // Set the callback click event for the table row
                    $(document).on('click', '.cohort_of_interest_table tbody tr', function () {
                        var datatable = self.datatables[$(this).parents('.cohort_of_interest_table').attr('id')];
                        var data = datatable.data()[datatable.row(this)[0]];
                        if (data) {
                            var did = data.outcome_cohort_definition_id;
                            var concept_name = data.name;
                            self.drilldown(did, concept_name, $(this).parents('.cohort_of_interest_table').attr('type'));
                        }
                    });

                    // Show the subset of the overall cohort conditions in this section.
                    var datatable = $('#cohort_of_interest_table').DataTable({
                        order: [6, 'desc'],
                        dom: 'T<"clear">lfrtip',
                        data: data,
                        columns: [{
                                data: 'exposure_cohort_definition_id'
                            },
                            {
                                data: 'outcome_cohort_definition_id'
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
                                data: 'time_at_risk'
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
                    self.datatables['cohort_of_interest_table'] = datatable;    
                }
            });            
		}

        self.drilldown = function (id, name, type) {
			self.loadingReportDrilldown(true);
			self.activeReportDrilldown(false);
            var exposureCohortList = [self.model.currentExposureCohortId()];
			$.ajax({
				method: 'POST',
                data: ko.toJSON({
                    "EXPOSURE_COHORT_LIST" : exposureCohortList,
                    "OUTCOME_COHORT_LIST" : [id]
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

					var scatter = new jnj_chart.scatterplot();
					self.activeReportDrilldown(true);
					$('#cohortOfInterestDrilldownScatterplotHeading').html(name);

					scatter.render(totalRecordsData, "#cohortOfInterestDrilldownScatterplot", 460, 150, {
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
		viewModel: cohortsOfInterest,
		template: view
	};

	ko.components.register('cohorts-of-interest', component);
	return component;
});