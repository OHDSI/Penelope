requirejs.config({
    baseUrl: 'js',
    packages: [
		{
		    name: "databindings",
		    location: "databindings"
		},
        {
		    name: "extenders",
		    location: "extenders"
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
        "lscache": "lscache.min",
		"packinghierarchy": "visualization.packinghierarchy",
		"forcedirectedgraph": "visualization.forcedirectedgraph",
		"kerneldensity": "visualization.kerneldensity",        
        "knockout.dataTables.binding": "knockout.dataTables.binding", // OHDSI CDN Candidate
        "cache-flush": "components/cache-flush",
        "datatable-test": "components/datatable-test",
        //"drug-era-report": "components/drug-era-report",
        "drug-label": "components/drug-label",
        "exposure-summary": "components/exposure-summary",
        "faceted-datatable": "components/faceted-datatable",
        "home": "components/home",
        "search": "components/search",
        "search-results": "components/search-results",
        "condition-concept-by-index" : "components/condition-concept-by-index",
		"d3": "d3.min",
		"d3_tip": "d3.tip",
		"jnj_chart": "jnj.chart",
		"lodash": "lodash.min"
        //"datatablesbuttons": "https://cdn.datatables.net/buttons/1.0.3/js/dataTables.buttons.min", // Try again when DataTables is upgraded to 1.10.10
        //"jsbuttons": "https://cdn.datatables.net/buttons/1.0.3/js/buttons.html5.min", // Try again when DataTables is upgraded to 1.10.10
	}
});

requirejs(['knockout', './app', 'lscache', 'director', 'cache-flush', 'drug-label', 'exposure-summary', 'faceted-datatable', 'home', 'search', 'search-results', 'condition-concept-by-index'], function(ko, app) {
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
        },
        '/cache': function () {
            pageModel.currentView('cache');
        }
	}
    pageModel.router = new Router(routes).configure(routerOptions);
    window.pageModel = pageModel;
    
    // Get the sources from localStorage - if not found, retrieve them from the WS
    if (pageModel.sources().length == 0)
    {
        // initialize all service information asynchronously
        $.each(pageModel.services(), function (serviceIndex, service) {
            service.sources = [];
            //var servicePromise = $.Deferred();
            //pageModel.initPromises.push(servicePromise);

            $.ajax({
                url: service.url + 'source/sources',
                method: 'GET',
                contentType: 'application/json',
                success: function (sources) {
                    service.available = true;
                    var completedSources = 0;

                    $.each(sources, function (sourceIndex, source) {
                        source.hasVocabulary = false;
                        source.hasEvidence = false;
                        source.hasResults = false;
                        source.vocabularyUrl = '';
                        source.evidenceUrl = '';
                        source.resultsUrl = '';
                        source.error = '';

                        source.initialized = true;
                        for (var d = 0; d < source.daimons.length; d++) {
                            var daimon = source.daimons[d];

                            // evaluate vocabulary daimons
                            if (daimon.daimonType == 'Vocabulary') {
                                source.hasVocabulary = true;
                                source.vocabularyUrl = service.url + source.sourceKey + '/vocabulary/';
                                /*
                                if (daimon.priority >= vocabularyPriority) {
                                    vocabularyPriority = daimon.priority;
                                    pageModel.vocabularyUrl(source.vocabularyUrl);
                                }
                                */
                            }

                            // evaluate evidence daimons
                            if (daimon.daimonType == 'Evidence') {
                                source.hasEvidence = true;
                                source.evidenceUrl = service.url + source.sourceKey + '/evidence/';
                                /*
                                if (daimon.priority >= evidencePriority) {
                                    evidencePriority = daimon.priority;
                                    pageModel.evidenceUrl(source.evidenceUrl);
                                }
                                */
                            }

                            // evaluate results daimons
                            if (daimon.daimonType == 'Results') {
                                source.hasResults = true;
                                source.resultsUrl = service.url + source.sourceKey + '/cdmresults/';
                                /*
                                if (daimon.priority >= densityPriority) {
                                    densityPriority = daimon.priority;
                                    pageModel.resultsUrl(source.resultsUrl);
                                }
                                */
                            }
                        }

                        //service.sources.push(source);
                        pageModel.sources.push(source);
                    });
                },
                error: function (xhr, ajaxOptions, thrownError) {
                    service.available = false;
                    service.xhr = xhr;
                    service.thrownError = thrownError;
                    //servicePromise.resolve();

                    pageModel.appInitializationFailed(true);
                }
            });
        });
    }
    
    // Get the sources and set the pageModel variables appropriately
    if (pageModel.sources().length > 0)
    {
        $.each(pageModel.sources(), function(sourceIndex, source) {
            // establish base priorities for daimons
            var evidencePriority = 0;
            var vocabularyPriority = 0;
            var densityPriority = 0;

            for (var d = 0; d < source.daimons.length; d++) {
                var daimon = source.daimons[d];

                // evaluate vocabulary daimons
                if (daimon.daimonType == 'Vocabulary') {
                    if (daimon.priority >= vocabularyPriority) {
                        vocabularyPriority = daimon.priority;
                        pageModel.vocabularyUrl(source.vocabularyUrl);
                    }
                }

                // evaluate evidence daimons
                if (daimon.daimonType == 'Evidence') {
                    if (daimon.priority >= evidencePriority) {
                        evidencePriority = daimon.priority;
                        pageModel.evidenceUrl(source.evidenceUrl);
                    }
                }

                // evaluate results daimons
                if (daimon.daimonType == 'Results') {
                    if (daimon.priority >= densityPriority) {
                        densityPriority = daimon.priority;
                        pageModel.resultsUrl(source.resultsUrl);
                    }
                }
            }        
        });
    }
        
    //$.when.apply($, pageModel.initPromises).done(pageModel.initComplete);
    $.when.apply($).done(pageModel.initComplete);
    ko.applyBindings(pageModel);
});
