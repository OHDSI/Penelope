define(['knockout', 'text!./cohorts-of-interest-predictors.html','d3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function cohortsOfInterestPredictors(params) {
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
                    
                    // Set the callback click event for the table row
                    $(document).on('click', '.cohorts_of_interest_predictors_table tbody tr', function () {
                        var datatable = self.datatables[$(this).parents('.cohorts_of_interest_predictors_table').attr('id')];
                        var data = datatable.data()[datatable.row(this)[0]];
                        if (data) {
                            var did = data.outcome_cohort_definition_id;
                            var cohort_name = data.outcome_cohort_name;
                            self.drilldown(did, cohort_name, $(this).parents('.cohorts_of_interest_predictors_table').attr('type'));
                        }
                    });

                    // Show the subset of the overall cohort conditions in this section.
                    var datatable = $('#cohorts_of_interest_predictors_table').DataTable({
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
				    self.datatables['cohorts_of_interest_predictors_table'] = datatable;    
                }
            });            
		}

        self.drilldown = function (id, name, type) {
			self.loadingReportDrilldown(true);
			self.activeReportDrilldown(false);
            var exposureCohortList = [self.model.currentExposureCohortId()];
			var outcomeCohortList = [id];
            
            $.ajax({
				method: 'POST',
                data: ko.toJSON({
                    "EXPOSURE_COHORT_LIST" : exposureCohortList,
                    "OUTCOME_COHORT_LIST" : outcomeCohortList,
                    "MIN_CELL_COUNT": 100
                }),
				url: self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/predictors',
				contentType: "application/json; charset=utf-8",
				success: function (data) {
					self.activeReportDrilldown(true);
                    $('#cohortPredictorsHeading').html(name + " Predictors");
                    
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
                                "concept_id": d.concept_id,
                                "concept_name": d.concept_name,
                                "domain_id": d.domain_id,
                                "concept_w_outcome": self.model.formatComma(d.concept_w_outcome),
                                "pct_outcome_w_concept": self.model.formatPercent(d.pct_outcome_w_concept),
                                "pct_nooutcome_w_concept": self.model.formatPercent(d.pct_nooutcome_w_concept),
                                "abs_std_diff": self.model.formatFixed(d.abs_std_diff)
                            }
                        }
                    });

                    // Remove the NULL values from the subset
					var table_data = $.grep(table_data, function(n, i) {
						return n != null
					});
                    
                    // Show the subset of the overall cohort conditions in this section.
                    var datatable = $('#cohort_predictors_table').DataTable({
                        order: [10, 'desc'],
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
                                    $(nTd).html("<a target='_blank' href='" + self.model.services()[0].circe + "/#/"+oData.outcome_cohort_definition_id+"'>"+oData.outcome_cohort_name+"</a>");
                                }                                
                            },
                            {
                                data: 'concept_id',
                                className: 'numeric'
                            },
                            {
                                data: 'concept_name',
                                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                                    $(nTd).html("<a target='_blank' href='" + self.model.services()[0].atlas + "/#/concept/"+oData.concept_id+"'>"+oData.concept_name+"</a>");
                                }
                            },
                            {
                                data: 'domain_id'
                            },
                            {
                                data: 'concept_w_outcome',
                                className: 'numeric'
                            },
                            {
                                data: 'pct_outcome_w_concept',
                                className: 'numeric'
                            },
                            {
                                data: 'pct_nooutcome_w_concept',
                                className: 'numeric'
                            },
                            {
                                data: 'abs_std_diff',
                                className: 'numeric'
                            }
                        ],
                        pageLength: 10,
                        lengthChange: false,
                        deferRender: true,
                        destroy: true
                    });
                    self.datatables['cohort_predictors_table'] = datatable;    
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
		viewModel: cohortsOfInterestPredictors,
		template: view
	};

	ko.components.register('cohorts-of-interest-predictors', component);
	return component;
});