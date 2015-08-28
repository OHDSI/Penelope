define(['knockout', 'text!./faceted-datatable.html', 'facets', 'knockout.dataTables.binding', 'colvis'], function (ko, view, facetEngine) {

	function facetedDatatable(params) {
		var self = this;

		self.reference = params.reference;
		self.options = params.options;
		self.model = params.model;
		self.columns = params.columns;
		self.data = ko.observableArray();
		self.facetEngine = ko.observable();

		self.updateFilters = function () {
			$(event.target).closest('.facetMemberName').toggleClass('selected');

			var filters = [];
			$(event.target).closest('.feFilter').find('.facetMemberName.selected span').each(function (i, d) {
				filters.push(d.id);
			});

			self.facetEngine().SetFilter(filters);
			self.facetEngine(self.facetEngine());
			self.data(self.facetEngine().GetCurrentObjects());
		};

		self.reference.subscribe(function () {
			self.feTemp = new FacetEngine(self.options);

			for (var i = 0; i < self.reference().length; i++) {
				self.feTemp.Process(self.reference()[i]);
			}
			self.feTemp.MemberSortFunction = function () {
				return this.ActiveCount
			};
			self.feTemp.sortFacetMembers();

			self.facetEngine(self.feTemp);
			self.data(self.reference());
		});
	};

	var component = {
		viewModel: facetedDatatable,
		template: view
	};

	ko.components.register('faceted-datatable', component);
	return component;
});