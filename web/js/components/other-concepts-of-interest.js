define(['knockout', 'text!./other-concepts-of-interest.html','d3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function otherConceptsOfInterest(params) {
		var self = this;
		self.model = params.model;
		self.datatables = {};
        self.loading = ko.observable(false);
        self.hasNoResults = ko.observable(false);
        self.loadingReportDrilldown = ko.observable(false);
        self.activeReportDrilldown = ko.observable(false);
        
		self.render = function () {
            self.loading(true);            
            self.hasNoResults(false);
            var conceptsOfInterest = [];
            
            // Get the matching concepts of interest
            $.ajax({
				type: "GET",
				url: self.model.evidenceUrl() + 'conceptofinterest/' + self.model.selectedConditionConceptId(),
            }).done(function (results) {
                var table_data = null;
                if (results != null && results.length > 0) {
                    conceptsOfInterest = results.map(function(d, i) {
                        return d.conceptOfInterestId;
                    });

                    if (conceptsOfInterest.length == 0) {
                    	return;
                    }

                    // Get the descendants for the concepts of interest
                    $.ajax({
                        type: "POST",
                        data: ko.toJSON(conceptsOfInterest),
                        url: self.model.vocabularyUrl() + "conceptlist/descendants",
                        contentType: "application/json; charset=utf-8",
                        success: function (result) {
                            self.loading(false);
                            // Pull back the full list of conditions for the selected drug cohort
                            var allConditions = self.model.selectedConditionOccurrencePrevalence();

                            // The result object contains the descendant concepts - use this to pull out this subset
                            // of concepts from the allConditions object
                            var allConditions_subset = result.map(function (val, index) {
                                var concept_id = val.CONCEPT_ID;
                                var matchingResult = $.grep(allConditions, function(n, i) { 
                                    return n.concept_id == concept_id;
                                });
                                if (matchingResult.length > 0){
                                    return matchingResult[0];
                                } else {
                                    return null;
                                }
                            });

                            // Remove the NULL values from the subset
                            var table_data = $.grep(allConditions_subset, function(n, i) {
                                return n != null
                            });

                            // Set the callback click event for the table row
                            $(document).on('click', '.other_concepts_of_interest_table tbody tr', function () {
                                var datatable = self.datatables[$(this).parents('.other_concepts_of_interest_table').attr('id')];
                                var data = datatable.data()[datatable.row(this)[0]];
                                if (data) {
                                    var did = data.concept_id;
                                    var concept_name = data.name;
                                    self.drilldown(did, concept_name, $(this).parents('.other_concepts_of_interest_table').attr('type'));
                                }
                            });

                            // Show the subset of the overall cohort conditions in this section.
                            var datatable = $('#other_concepts_of_interest_table').DataTable({
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
                            self.datatables['other_concepts_of_interest_table'] = datatable;                                
                        }
});                        
                }
                else {
                    self.loading(false);
                    self.hasNoResults(true);
                }
            });
		}

        self.drilldown = function (id, name, type) {
			self.loadingReportDrilldown(true);
			self.activeReportDrilldown(false);

			$.ajax({
				type: "GET",
				url: self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/' + self.model.currentExposureCohortId() + '/cohortspecific' + type + "/" + id,
				contentType: "application/json; charset=utf-8"
			}).done(function (result) {
				if (result && result.length > 0) {
					$("#" + type + "OtherConceptsOfInterestDrilldownScatterplot").empty();
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
					$('#' + type + 'OtherConceptsOfInterestDrilldownScatterplotHeading').html(name);

					scatter.render(totalRecordsData, "#" + type + "OtherConceptsOfInterestDrilldownScatterplot", 460, 150, {
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
        
        self.model.selectedConditionConceptId.subscribe(function(newValue) {
        	if (newValue > 0) {
				self.evaluateRender();        		
        	}
        });
        
        self.model.selectedConditionOccurrencePrevalence.subscribe(function(newValue) {
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
                if (self.model.selectedConditionConceptId() > 0 && self.model.selectedConditionOccurrencePrevalence() != undefined){
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
		viewModel: otherConceptsOfInterest,
		template: view
	};

	ko.components.register('other-concepts-of-interest', component);
	return component;
});