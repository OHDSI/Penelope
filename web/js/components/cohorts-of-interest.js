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
                    
            self.loading(false);
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