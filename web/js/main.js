requirejs.config({
    baseUrl: 'js',
    packages: [
		{
		    name: "databindings",
		    location: "databindings"
		}
    ],
    config: {
		text: {
			useXhr: function (url, protocol, hostname, port) {
				return true;
			}
		}
	},    
	map: {
		'*': {
			'css': 'plugins/css.min'//,
			//'text': 'plugins/text'
		}
	},
	shim: {
        "colorbrewer": {
			exports: 'colorbrewer'
		},
		"bootstrap": {
			"deps": [
				'jquery',
                'jquery-ui'
				//"css!https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.2/css/bootstrap.min.css",
                //"css!https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.2/css/bootstrap-theme.min.css",               
                //"css!https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min.css",
                //"css!https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.theme.min.css",
                //"css!https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.structure.min.css"
			]
		},
        "facets": {
			"deps": ['jquery'],
			exports: 'FacetEngine'
		}
	},
	paths: {
        "text": "plugins/text",
		"jquery":  "https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.2/jquery.min",
        "jquery-ui": "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.11.4/jquery-ui.min",
        "jquery-scrollTo": "https://cdnjs.cloudflare.com/ajax/libs/jquery-scrollTo/2.1.2/jquery.scrollTo",
		"bootstrap": "https://cdnjs.cloudflare.com/ajax/libs/twitter-bootstrap/3.3.2/js/bootstrap.min",
		"colvis": "https://cdnjs.cloudflare.com/ajax/libs/datatables-colvis/1.1.0/js/datatables.colvis.min",
        "knockout": "https://cdnjs.cloudflare.com/ajax/libs/knockout/3.3.0/knockout-min",
        "datatables": "https://cdnjs.cloudflare.com/ajax/libs/datatables/1.10.8/js/jquery.dataTables.min",
        "director": "https://cdnjs.cloudflare.com/ajax/libs/Director/1.2.8/director.min",
		"d3": "d3.min",
		"d3_tip": "d3.tip",
		"jnj_chart": "jnj.chart",
		"lodash": "lodash.min",
		"packinghierarchy": "visualization.packinghierarchy",
		"forcedirectedgraph": "visualization.forcedirectedgraph",
		"kerneldensity": "visualization.kerneldensity",        
        "knockout.dataTables.binding": "knockout.dataTables.binding", // OHDSI CDN Candidate
        "datatable-test": "components/datatable-test",
        "drug-label": "components/drug-label",
        "faceted-datatable": "components/faceted-datatable",
        "home": "components/home",
        "search": "components/search",
        "search-results": "components/search-results",
        "concept-by-index" : "http://hixbeta.jnj.com/atlas/js/components/visualizations/concept-by-index" // "https://rawgit.com/OHDSI/Atlas/master/js/components/visualizations/concept-by-index" 
        //"datatablesbuttons": "https://cdn.datatables.net/buttons/1.0.3/js/dataTables.buttons.min", // Try again when DataTables is upgraded to 1.10.10
        //"jsbuttons": "https://cdn.datatables.net/buttons/1.0.3/js/buttons.html5.min", // Try again when DataTables is upgraded to 1.10.10
	}
});

requirejs(['knockout', './app', 'director', 'drug-label', 'faceted-datatable', 'home', 'search', 'search-results', 'concept-by-index'], function(ko, app) {
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
		},
        '/druglabel/:setid:': pageModel.displayLabel,
        '/datatabletest/': function() {
            pageModel.currentView('datatabletest');
        }
	}
    pageModel.router = new Router(routes).configure(routerOptions);
    window.pageModel = pageModel;
    $.when.apply($).done(pageModel.initComplete);
    ko.applyBindings(pageModel);
});
