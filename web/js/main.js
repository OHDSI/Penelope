requirejs.config({
	baseUrl: 'js',
	map: {
		'*': {
			'css': 'plugins/css.min',
			'text': 'plugins/text'
		}
	},
	shim: {
		"bootstrap": {
			"deps": [
				'jquery',
				"css!https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.2/css/bootstrap.min.css",
                "css!https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.2/css/bootstrap-theme.min.css"
			]
		},
        "facets": {
			"deps": ['jquery'],
			exports: 'FacetEngine'
		}
	},
	paths: {
		"jquery":  "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.2/jquery.min",
		"bootstrap": "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.2/js/bootstrap.min",
		"colvis": "https://cdnjs.cloudflare.com/ajax/libs/datatables-colvis/1.1.0/js/datatables.colvis.min",
        "knockout": "https://cdnjs.cloudflare.com/ajax/libs/knockout/3.3.0/knockout-min",
        "datatables": "https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.8/js/jquery.dataTables.min",
        "director": "https://cdnjs.cloudflare.com/ajax/libs/Director/1.2.8/director.min",
        "knockout.dataTables.binding": "knockout.dataTables.binding", // OHDSI CDN Candidate
        "faceted-datatable": "components/faceted-datatable",
        "home": "components/home",
        "search": "components/search",
        "search-results": "components/search-results"
	}
});

requirejs(['knockout', './app', 'director', 'faceted-datatable', 'home', 'search', 'search-results'], function(ko, app) {
    var pageModel = new app();
    var routerOptions = {
		notfound: function () {
			pageModel.currentView('home');
		}
	}
    var routes = {
		'/search/:query:': pageModel.search,
		'/search': function () {
			pageModel.currentView('search');
		}
	}
    pageModel.router = new Router(routes).configure(routerOptions);
    window.pageModel = pageModel;
    $.when.apply($).done(pageModel.initComplete);
    ko.applyBindings(pageModel);
});
