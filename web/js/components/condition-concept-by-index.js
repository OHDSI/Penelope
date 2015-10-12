define(['knockout', 'text!./condition-concept-by-index.html','d3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function conceptByIndex(params) {
		var self = this;
		self.model = params.model;
		self.datatables = {};
        //self.loading = ko.observable(false);
        self.loadingConditionPrevalence = ko.observable(false);
        self.loadingDrugPrevalence = ko.observable(false);
        self.loadingDrugEras = ko.observable(false);
        self.loadingReportDrilldown = ko.observable(false);
        self.activeReportDrilldown = ko.observable(false);

        /*
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
		*/
        
		self.render = function () {
			// If there is no concept specified, there is no need to retrieve the data....
			if (self.model.selectedConditionConceptId() <= 0 && self.model.selectedConditionOccurrencePrevalence() == undefined)
				return;

            $('#condition-concept-by-index-caption').html('First Condition Occurrence Of ' + self.model.selectedConditionConceptName() + ' Relative To Index');
			
            // Get the descendant concepts - this may be centralized to a model event instead of nested in this component
			$.ajax({
				type: "GET",
				url: self.model.vocabularyUrl() + "concept/" + self.model.selectedConditionConceptId() + "/descendants",
				contentType: "application/json; charset=utf-8",
				success: function (result) {
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
                        pageLength: 5,
                        lengthChange: false,
                        deferRender: true,
                        destroy: true
                    });
                    self.datatables['condition_concept_table'] = datatable;
                                
                    /*
					if (result && result.length > 0) {
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

						scatter.render(totalRecordsData,'#condition-concept-by-index-scatterplot', 460, 150, {
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
					}
                    */
				}
			});
		}
        
        self.model.selectedConditionConceptId.subscribe(function(newValue) {
            self.render();
        });
        
		self.render();
	}

	var component = {
		viewModel: conceptByIndex,
		template: view
	};

	ko.components.register('condition-concept-by-index', component);
	return component;
});