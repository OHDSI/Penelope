define(['knockout', 'text!./search-results.html', 'knockout.dataTables.binding'], function (ko, view) {
	function penelopeSearchResults(params) {
		var self = this;
		self.model = params.model;
        self.searchResults = params.model.searchResultsConcepts;
		self.datatables = {};
        self.columns = [{
                            data: 'searchName',
                            title: 'Drug',
                            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                                $(nTd).html("<a href='#/druglabel/" + oData.setid +"'>"+oData.searchName+"</a>")
                            }
                        },
                        {
                            title: 'Ingredient',
                            data: 'ingredientConceptName'
                        },
                        {
                            title: 'Ingredient Concept Id',
                            data: 'ingredientConceptId'
                        },
                        {
                            title: 'Exposure Cohort',
                            data: 'cohortId',
                            "fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
                                if (oData.cohortId != null || oData.cohortId != undefined) {
                                $(nTd).html("<a target='_blank' href='" + self.model.services()[0].circe + "/#/"+oData.cohortId+"'>View Cohort Definition</a>")
                                }
                                else {
                                    $(nTd).html("");
                                }
                            }
                        }
                    ];
    }

	var component = {
		viewModel: penelopeSearchResults,
		template: view
	};

	ko.components.register('penelope-search-results', component);
	return component;
});
