define(['knockout', 'text!./search-results.html', 'knockout.dataTables.binding'], function (ko, view) {
	function penelopeSearchResults(params) {
		var self = this;
		self.model = params.model;
	}

	var component = {
		viewModel: penelopeSearchResults,
		template: view
	};

	ko.components.register('penelope-search-results', component);
	return component;
});
