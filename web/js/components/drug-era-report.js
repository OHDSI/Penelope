define(['knockout', 'text!./drug-era-report.html','d3', 'jnj_chart', 'datatables'], function (ko, view, d3, jnj_chart, datatables) {
	function conceptByIndex(params) {
		var self = this;
		self.model = params.model;
        /*
		self.conceptId = params.conceptId;
		self.conceptName = params.conceptName;
		self.cohortDefinitionId = params.cohortDefinitionId;
		self.caption = params.caption;
		self.conceptDomain = params.conceptDomain.toLowerCase();
		self.resultsUrl = params.resultsUrl;

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

        self.conceptId.subscribe(function(newValue) {
            self.render();
        });
		*/
        
        
        
		self.render = function () {
            var format_pct = d3.format('.2%');
            var format_fixed = d3.format('.2f');
            var format_comma = d3.format(',');

            // TODO: HACK - take out later
            var sourceKey = 'TRUVENCCAE';
            if (self.model.reportSourceKey() != null)
            {
            	sourceKey = self.model.reportSourceKey().sourceKey;
            }
            
            $.ajax({
				type: "POST",
                data: {
                            "CONCEPT_ID" : "1118084",
                            "ANCESTOR_VOCABULARY_ID" : "ATC",
                            "ANCESTOR_CLASS_ID" : "ATC 3rd",
                            "SIBLING_VOCABULARY_ID": "RxNorm",
                            "SIBLING_CLASS_ID": "Ingredient"
                        },
				//url: self.model.services()[0].url + sourceKey +  '/vocabulary/descendantofancestor',
                //url: self.model.services()[0].url + "OPTUM/vocabulary/descendantofancestor",
                url: "http://localhost:8080/WebAPI/OPTUM/vocabulary/descendantofancestor",
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    // Pass the resulting concept IDs into the drug era treemap call
                    var result = data.map(function (d, i) { return d.CONCEPT_ID });
                    /*
                    $.ajax({
                        type: "POST",
                        data: result,
                        url: self.model.services()[0].url + sourceKey +  '/cdmresults/drugeratreemap',
                        contentType: "application/json; charset=utf-8",
                        success: function (data) {
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
                                        num_persons: format_comma(d.numPersons),
                                        percent_persons: format_pct(d.percentPersons),
                                        length_of_era: format_fixed(d.lengthOfEra)
                                    }
                                }, data);

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
                                            data: 'atc1'
                                        },
                                        {
                                            data: 'atc3',
                                            visible: false
                                        },
                                        {
                                            data: 'atc5'
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
                    */
                }
            });            
		}
                
		self.render();
	}

	var component = {
		viewModel: conceptByIndex,
		template: view
	};

	ko.components.register('drug-era-report', component);
	return component;
});