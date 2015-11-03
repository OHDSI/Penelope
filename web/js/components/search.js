define(['knockout', 'text!./search.html', 'knockout.dataTables.binding'], function (ko, view) {
	function penelopeSearch(params) {
		var self = this;
		self.model = params.model;

		self.checkExecuteSearch = function (data, e) {
			if (e.keyCode == 13 || e.type == 'click') { // enter
				var query = $('#querytext').val();
                document.location = "#/search/" + encodeURI(query);
                /*
				if (query.length > 2) {
					document.location = "#/search/" + encodeURI(query);
				} else {
					$('#helpMinimumQueryLength').modal('show');
				}
                */
			}
		};
	}

	var component = {
		viewModel: penelopeSearch,
		template: view
	};

	ko.components.register('penelope-search', component);
	return component;
});
