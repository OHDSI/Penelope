define(['knockout', 'text!./label-evidence.html', 'knockout.dataTables.binding', 'jquery'], function (ko, view) {
	function labelEvidence(params) {
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
            var ingredientConceptList = self.model.selectedDrugAndAncestorDescendants().map(function(d, i) { return d.concept_id });
            $.ajax({
				method: 'POST',
                data: ko.toJSON({
                    "CONDITION_CONCEPT_LIST" : conditionConceptList,
                    "INGREDIENT_CONCEPT_LIST" : ingredientConceptList,
                    "EVIDENCE_TYPE_LIST": ["SPL_SPLICER_ADR"]
                }),
				url: self.model.evidenceUrl() + 'spontaneousreports',
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    self.loadingSummary(false);
                    // Create a single data structure that contains the full ingredient list
                    // stored in self.model.selectedDrugAndAncestorDescendants() merged with 
                    // the data returned from this service to indicate if there is evidence that
                    // the label contains evidence for the selected condition concept + descendants
                    var labelEvidenceResult = self.model.selectedDrugAndAncestorDescendants().map(
                        function(d, i) {
                            var ingredientConceptId = d.concept_id;
                            var matchAgainstEvidence = $.grep(data, function(n, i) {
                                return n.INGREDIENT_CONCEPT_ID == ingredientConceptId;
                            });
                            return {
                                "CONCEPT_ID": d.concept_id,
                                "CONCEPT_NAME": d.ingredient,
                                "ATC3": d.atc3,
                                "ATC5": d.atc5,
                                "HAS_EVIDENCE": matchAgainstEvidence.length > 0
                            };
                        });
                    /*
                    var labelEvidenceResult = result.map(function (val, index) {
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
                    */
                    
                    var datatable = $('#label-evidence-summary-table').DataTable({
                        order: [2, 'desc'],
                        dom: 'T<"clear">lfrtip',
                        data: labelEvidenceResult, //table_data,
                        columns: [
                            {
                                data: 'CONCEPT_NAME'
                            },
                            {
                                data: 'ATC3'
                            },
                            {
                                data: 'ATC5'
                            },
                            {
                            	data: 'HAS_EVIDENCE'
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
        
        self.model.selectedConditionConceptAndDescendants.subscribe(function(newValue) {
        	if (newValue != null) {        		
            	self.render();
        	}
        });        
        
    }

	var component = {
		viewModel: labelEvidence,
		template: view
	};

	ko.components.register('label-evidence', component);
	return component;
});