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
				"css!https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css",
				"css!https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap-theme.min.css"
			]
		}
	},
	paths: {
		"jquery": "http://code.jquery.com/jquery-1.11.2.min",
		"bootstrap": "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min",
		"knockout": "https://cdnjs.cloudflare.com/ajax/libs/knockout/3.2.0/knockout-min",
        "datatables": "https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.8/js/jquery.dataTables.min",
        "director": "https://cdnjs.cloudflare.com/ajax/libs/Director/1.2.8/director.min",
        "knockout.dataTables.binding": "knockout.dataTables.binding", // OHDSI CDN Candidate
        "search": "components/search",
        "home": "components/home"
	}
});

requirejs(['knockout', './app', 'director', 'search', 'home'], function(ko, app) {
    var pageModel = new app();
//    var routerOptions = {
//		notfound: function () {
//			pageModel.currentView('search');
//		}
//	}
//    var routes = {
//		'/search': function () {
//			pageModel.currentView('search');
//		}
//	}    
//    pageModel.router = new Router(routes).configure(routerOptions);
    window.pageModel = pageModel;
    ko.applyBindings(pageModel);
});
