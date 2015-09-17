define(['knockout', 'text!./datatable-test.html', 'jquery', 'datatables', 'jsbuttons', 'datatablesbuttons'], function (ko, view) {
	function home(params) {
		var self = this;
		self.model = params.model;
        
        $('#example').DataTable( {
            dom: 'Bfrtip',
            buttons: [
                'copyHtml5',
                'excelHtml5',
                'csvHtml5',
                'pdfHtml5'
            ]
        } );
	}

    var component = {
		viewModel: home,
		template: view
	};

	ko.components.register('datatable-test', component);
	return component;
});
