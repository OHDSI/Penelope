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
        
        self.getSpontaneousReportsSummary = function() {
            alert('Spontaneous Report Summary Call');
        }
    }
    
    

	var component = {
		viewModel: drugLabel,
		template: view
	};

	ko.components.register('drug-label', component);
	return component;
});
