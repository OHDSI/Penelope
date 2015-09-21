define(['knockout', 'text!./drug-label.html', 'jquery', 'jquery-ui'], function (ko, view) {
	function drugLabel(params) {
		var self = this;
		self.model = params.model;

		self.openEvidenceBrowser = function () {
          $.ajax({
				method: 'GET',
				url: 'js/mock-data/search-results.json', //self.model.services()[0].url + 'conceptset/',
				dataType: 'json',
				success: function (data) {
					//self.conceptSets(data);
                    $('#evidenceBrowserTabs').tabs();
					$('#evidenceExplorer').modal('show');
				}
			});
		}    
        
        self.getLiteratureSummary = function() {
            $.ajax({
				method: 'GET',
				url: 'js/mock-data/sci-lit-summary.json', //self.model.services()[0].url + 'conceptset/',
				dataType: 'json',
				success: function (data) {
                    self.model.literatureEvidenceResults(data);
                    $('#literature').accordion({heightStyle: "content"});
				}
			});
        }

/*
        self.getLiteratureSummary = function() {
            var litSummary = $.ajax({
                        method: 'GET',
                        url: 'js/mock-data/sci-lit-summary.json', //self.model.services()[0].url + 'conceptset/',
                        dataType: 'json',
                        async: false
                    }).responseText;
            
            self.model.literatureEvidenceSummary(litSummary);

                // For the first data element, get the details. Talk to FD about how to clean this up
             var litDetails = $.ajax({
                    method: 'GET',
                    url: 'js/mock-data/sci-lit-details.json', //self.model.services()[0].url + 'conceptset/',
                    dataType: 'json',
                    async: false
                }).responseText;
            
            $('#literature').accordion({heightStyle: "content"});
        }
        
        self.getLiteratureSummaryFromService = function() {
            $.ajax({
				method: 'GET',
				url: 'js/mock-data/sci-lit-summary.json', //self.model.services()[0].url + 'conceptset/',
				dataType: 'json',
				success: function (data) {
                    self.model.literatureEvidenceSummary(data);
				}
			});            
        }
*/
        
        self.getSpontaneousReportsSummary = function() {
            alert('Spontaneous Report Summary Call');
        }
        
        self.productLabelLinkClick = function(item, event) {
            self.model.selectedConditionConceptId(event.target.attributes["conceptid"].value);
            self.model.selectedConditionConceptName(event.target.attributes["conceptname"].value);
            self.openEvidenceBrowser();
        }        
        
        self.drugLabelPostProcessingLogic = function(elements){
            alert('got here');
        }
    }

	var component = {
		viewModel: drugLabel,
		template: view
	};

	ko.components.register('drug-label', component);
	return component;
});
