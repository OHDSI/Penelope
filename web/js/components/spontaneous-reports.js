define(['knockout', 'text!./spontaneous-reports.html', 'knockout.dataTables.binding', 'jquery'], function (ko, view) {
	function spontaneousReports(params) {
		var self = this;
		self.model = params.model;
        self.datatables = {};
        self.loadingSummary = ko.observable(false);
        self.hasDetailError = ko.observable(false);
        self.detailErrorMsg = ko.observable('');
        
        self.render = function() {
            self.loadingSummary(true);
            self.resetDetailError();
            var conditionConceptList = self.model.selectedConditionConceptAndDescendants().map(function(d, i) { return d.CONCEPT_ID });
            var ingredientConceptList = [self.model.currentDrugConceptId()];
            $.ajax({
				method: 'POST',
                data: ko.toJSON({
                    "CONDITION_CONCEPT_LIST" : conditionConceptList,
                    "INGREDIENT_CONCEPT_LIST" : ingredientConceptList
                }),
				url: self.model.evidenceUrl() + 'spontaneousreports',
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    self.loadingSummary(false);
                    //var table_data;
                    //var normalizedData = self.model.normalizeDataframe(self.model.normalizeArray(data, true));
                    var datatable = $('#sr-summary-table').DataTable({
                        order: [2, 'desc'],
                        dom: 'T<"clear">lfrtip',
                        data: data, //table_data,
                        columns: [
                            {
                                data: 'CONDITION_CONCEPT_NAME'
                            },
                            {
                                data: 'REPORT_COUNT',
                                className: 'numeric'
                            },
                            {
                                data: 'PRR',
                                className: 'numeric'
                            }
                        ],
                        pageLength: 5,
                        lengthChange: false,
                        deferRender: true,
                        destroy: true
                    });
                    self.datatables['sr_summary_table'] = datatable;
                    
				},
                error: function(data, textStatus, errorThrown) {
                    self.loadingSummary(false);
                    self.hasDetailError(true);
                    self.detailErrorMsg("An error occurred: " + textStatus);
                }
			}); 
        }
        
        self.resetDetailError = function() {
            self.hasDetailError(false);
            self.detailErrorMsg('');
        }
        
        self.model.selectedConditionConceptId.subscribe(function(newValue) {
        	if (newValue > 0) {
				self.evaluateRender();        		
        	}
        });

        self.model.selectedConditionConceptAndDescendants.subscribe(function(newValue) {
        	if (newValue != null) {        		
            	self.evaluateRender();
        	}
        });        
        
        self.model.currentDrugConceptId.subscribe(function(newValue) { 
            if (newValue > 0) {
            	self.evaluateRender();
            }
        });
                                                  
        self.evaluateRender = function() {
            try
            {
                if (self.model.selectedConditionConceptId() > 0 && self.model.currentDrugConceptId() > 0 && self.model.selectedConditionConceptAndDescendants() != null){
                    self.render();
                }
                else{
                    self.loadingSummary(true);
                }                
            }
            catch (e)
            {
                self.loadingSummary(true);
            }
        }
                                                  
    }

	var component = {
		viewModel: spontaneousReports,
		template: view
	};

	ko.components.register('spontaneous-reports', component);
	return component;
});