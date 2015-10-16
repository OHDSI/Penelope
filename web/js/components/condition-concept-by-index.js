define(['knockout', 'text!./condition-concept-by-index.html','d3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function conceptByIndex(params) {
		var self = this;
		self.model = params.model;
		self.datatables = {};
        //self.loading = ko.observable(false);
        self.loadingRelatedConcepts = ko.observable(false);
        self.loadingDrugPrevalence = ko.observable(false);
        self.loadingDrugEras = ko.observable(false);
        self.loadingReportDrilldown = ko.observable(false);
        self.activeReportDrilldown = ko.observable(false);
        
		self.render = function () {
            self.loadingRelatedConcepts(true);

            var result = self.model.selectedConditionConceptAndDescendants();
            // Pull back the full list of conditions for the selected drug cohort
            var table_data = self.model.selectedConditionOccurrencePrevalence();

            // The result object contains the descendant concepts - use this to pull out this subset
            // of concepts from the table_data object
            var table_data_subset = result.map(function (val, index) {
                var concept_id = val.CONCEPT_ID;
                var matchingResult = $.grep(table_data, function(n, i) { 
                    return n.concept_id == concept_id;
                });
                if (matchingResult.length > 0){
                    return matchingResult[0];
                } else {
                    return null;
                }
            });

            // Remove the NULL values from the subset
            var table_data_subset_no_nulls = $.grep(table_data_subset, function(n, i) {
                return n != null
            });
                    
            self.loadingRelatedConcepts(false);

            // Set the callback click event for the table row
            $(document).on('click', '.condition_concept_table tbody tr', function () {
                var datatable = self.datatables[$(this).parents('.condition_concept_table').attr('id')];
                var data = datatable.data()[datatable.row(this)[0]];
                if (data) {
                    var did = data.concept_id;
                    var concept_name = data.name;
                    self.drilldown(did, concept_name, $(this).parents('.condition_concept_table').attr('type'));
                }
            });
                    
            // Show the subset of the overall cohort conditions in this section.
            var datatable = $('#condition_concept_table').DataTable({
                order: [6, 'desc'],
                dom: 'T<"clear">lfrtip',
                data: table_data_subset_no_nulls,
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
                pageLength: 10,
                lengthChange: false,
                deferRender: true,
                destroy: true
            });
            self.datatables['condition_concept_table'] = datatable;   
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
					$("#" + type + "ConceptByIndexDrilldownScatterplot").empty();
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
					$('#' + type + 'ConceptByIndexDrilldownScatterplotHeading').html(name);

					scatter.render(totalRecordsData, "#" + type + "ConceptByIndexDrilldownScatterplot", 460, 150, {
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

        self.model.selectedConditionConceptAndDescendants.subscribe(function(newValue) {
        	if (newValue != null) {
				self.evaluateRender();        		
        	}
        });
        
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
        
        self.evaluateRender = function() {
            try
            {
                if (self.model.selectedConditionConceptId() > 0 && self.model.selectedConditionOccurrencePrevalence() != undefined && self.model.selectedConditionConceptAndDescendants().length > 0){
                    self.render();
                }
                else{
                    self.loadingRelatedConcepts(true);
                }                
            }
            catch (e)
            {
                self.loadingRelatedConcepts(true);
            }
        }
	}

	var component = {
		viewModel: conceptByIndex,
		template: view
	};

	ko.components.register('condition-concept-by-index', component);
	return component;
});