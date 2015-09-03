define(['knockout', 'text!./drug-label.html'], function (ko, view) {
	function drugLabel(params) {
		var self = this;
		self.model = params.model;
	}

	var component = {
		viewModel: drugLabel,
		template: view
	};

	ko.components.register('drug-label', component);
	return component;
});
