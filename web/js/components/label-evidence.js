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
				url: self.model.evidenceUrl() + 'labelevidence',
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    self.loadingSummary(false);
                    // Create a single data structure that contains the full ingredient list
                    // stored in self.model.selectedDrugAndAncestorDescendants() merged with 
                    // the data returned from this service to indicate if there is evidence that
                    // the label contains evidence for the selected condition concept + descendants
                    /*
                    var labelEvidenceResult = self.model.selectedDrugAndAncestorDescendants().map(
                        function(d, i) {
                            var ingredientConceptId = d.concept_id;
                            var matchAgainstEvidence = $.grep(data, function(n, i) {
                                return n.ingredient_concept_id == ingredientConceptId;
                            });
                            return {
                                "CONCEPT_ID": d.concept_id,
                                "CONCEPT_NAME": d.ingredient,
                                "ATC3": d.atc3,
                                "ATC5": d.atc5,
                                "HAS_EVIDENCE": matchAgainstEvidence.length > 0
                            };
                        });
                    */
                    
                    var labelEvidenceResult = data.map(
                        function(d, i) {
                            var ingredientConceptId = d.ingredient_concept_id;
                            var hasEvidence = null;
                            switch(d.hasEvidence)
                            {
                                case "0":
                                    hasEvidence = false;
                                    break;
                                case "1":
                                    hasEvidence = true;
                                    break;
                            }                                    
                            var findlookup = $.grep(self.model.selectedDrugAndAncestorDescendants(), function(n, i) {
                                return n.concept_id == ingredientConceptId;
                            });
                            return {
                                "CONCEPT_ID": d.ingredient_concept_id,
                                "CONCEPT_NAME": d.ingredient_concept_name,
                                "ATC3": findlookup[0].atc3,
                                "ATC5": findlookup[0].atc5,
                                "HAS_EVIDENCE": hasEvidence
                            };
                        });

                    var datatable = $('#label-evidence-summary-table').DataTable({
                        order: [2, 'desc'],
                        dom: 'T<"clear">lfrtip',
                        data: labelEvidenceResult, 
                        columns: [
                            {
                                data: 'CONCEPT_NAME',
                                "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                                    $(nTd).html("<a target='_blank' href='#/search/"+oData.CONCEPT_NAME+"'>"+oData.CONCEPT_NAME+"</a>");
                                }
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
                        pageLength: 10,
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
        
        self.model.selectedDrugAndAncestorDescendants.subscribe(function(newValue) {
            if (newValue != null) {
                self.evaluateRender();
            }
        });

        self.model.currentDrugConceptId.subscribe(function(newValue) {
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
                if (self.model.currentDrugConceptId() > 0 && self.model.selectedConditionConceptId() > 0 && self.model.selectedConditionConceptAndDescendants().length > 0 && self.model.selectedDrugAndAncestorDescendants().length > 0){
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
		viewModel: labelEvidence,
		template: view
	};

	ko.components.register('label-evidence', component);
	return component;
});