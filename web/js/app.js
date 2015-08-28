define([
	'jquery',
	'knockout',
	'components/webapi-configuration',
	'bootstrap',
    'facets',
	'css!styles/app'
], function ($, ko) {

	var appModel = function () {
        var self = this;
        
        // Search settings
        self.currentView = ko.observable('home');
        self.currentSearch = ko.observable();
        self.recentSearch = ko.observableArray(null);
        self.searchResultsConcepts = ko.observableArray();
        self.initComplete = function () {
            self.router.init('/');
        }
        // Example model settings
		self.appHeading = ko.observable('Welcome to Penelope');
		self.appBody = ko.observable('Personalized Exploratory Navigation and Evaluation for Labels Of Product Effects');

		// configure services to include at least one valid OHDSI WebAPI endpoint
		self.services = [
			{
				name: 'Local',
				url: 'http://hixbeta.jnj.com:8081/WebAPI/',
				dialect: ko.observable('loading'),
				version: ko.observable('loading')
			}
		];
        
		self.search = function (query) {
			self.currentView('loading');

			filters = [];
			$('#querytext').blur();
    
            // TEMPORARY CODE - Put into AJAX call later
            var tempCaption;
            var results = [  
               {  
                  "CONCEPT_ID":45768801,
                  "CONCEPT_NAME":"Bridging anticoagulant therapy with low molecular weight heparin",
                  "STANDARD_CONCEPT":"S",
                  "INVALID_REASON":"V",
                  "CONCEPT_CODE":"707309004",
                  "DOMAIN_ID":"Procedure",
                  "VOCABULARY_ID":"SNOMED",
                  "CONCEPT_CLASS_ID":"Procedure",
                  "INVALID_REASON_CAPTION":"Valid",
                  "STANDARD_CONCEPT_CAPTION":"Standard",
                    "DENSITY":0
               },
               {  
                  "CONCEPT_ID":45452644,
                  "CONCEPT_NAME":"Bridging anticoagulant therapy with low molecular weight heparin",
                  "STANDARD_CONCEPT":"N",
                  "INVALID_REASON":"V",
                  "CONCEPT_CODE":"88A5000",
                  "DOMAIN_ID":"Procedure",
                  "VOCABULARY_ID":"Read",
                  "CONCEPT_CLASS_ID":"Read",
                  "INVALID_REASON_CAPTION":"Valid",
                  "STANDARD_CONCEPT_CAPTION":"Non-Standard",
                    "DENSITY":0
               }
            ];

            if (decodeURI(query).length > 20) {
                tempCaption = decodeURI(query).substring(0, 20) + '...';
            } else {
                tempCaption = decodeURI(query);
            }

            lastQuery = {
                query: query,
                caption: tempCaption,
                resultLength: results.length
            };
            self.currentSearch(query);

            var exists = false;
            for (var i = 0; i < self.recentSearch().length; i++) {
                if (self.recentSearch()[i].query == query)
                    exists = true;
            }
            if (!exists) {
                self.recentSearch.unshift(lastQuery);
            }
            if (self.recentSearch().length > 7) {
                self.recentSearch.pop();
            }

            self.currentView('searchResults');
            self.searchResultsConcepts(results);
/*			$.ajax({
				url: self.vocabularyUrl() + 'search/' + query,
				success: function (results) {
					if (results.length == 0) {
						self.currentView('search');
						$('#modalNoSearchResults').modal('show');
						return;
					}

					var densityPromise = self.loadDensity(results);

					$.when(densityPromise).done(function () {
						var tempCaption;

						if (decodeURI(query).length > 20) {
							tempCaption = decodeURI(query).substring(0, 20) + '...';
						} else {
							tempCaption = decodeURI(query);
						}

						lastQuery = {
							query: query,
							caption: tempCaption,
							resultLength: results.length
						};
						self.currentSearch(query);

						var exists = false;
						for (var i = 0; i < self.recentSearch().length; i++) {
							if (self.recentSearch()[i].query == query)
								exists = true;
						}
						if (!exists) {
							self.recentSearch.unshift(lastQuery);
						}
						if (self.recentSearch().length > 7) {
							self.recentSearch.pop();
						}

						self.currentView('searchResults');
						self.searchResultsConcepts(results);
					});
				},
				error: function (xhr, message) {
					alert('error while searching ' + message);
				}
			}); */
		}        
        self.selectedConceptsIndex = {};
        
		self.searchConceptsColumns = [
			{
				title: '',
				render: function (s, p, d) {
					var css = '';
					var icon = 'fa-shopping-cart';

					if (self.selectedConceptsIndex[d.CONCEPT_ID] == 1) {
						css = ' selected';
					}
					return '<i class="fa ' + icon + ' ' + css + '"></i>';
				},
				orderable: false,
				searchable: false
			},
			{
				title: 'Id',
				data: 'CONCEPT_ID'
			},
			{
				title: 'Code',
				data: 'CONCEPT_CODE'
			},
			{
				title: 'Name',
				data: 'CONCEPT_NAME',
				render: function (s, p, d) {
					var valid = d.INVALID_REASON_CAPTION == 'Invalid' ? 'invalid' : '';
					return '<a class="' + valid + '" href=\"#/concept/' + d.CONCEPT_ID + '\">' + d.CONCEPT_NAME + '</a>';
				},
				width: '50%'
			},
			{
				title: 'Class',
				data: 'CONCEPT_CLASS_ID'
			},
			{
				title: 'Standard Concept Caption',
				data: 'STANDARD_CONCEPT_CAPTION',
				visible: false
			},
			{
				title: 'Density',
				data: 'DENSITY',
				className: 'numeric'
			},
			{
				title: 'Domain',
				data: 'DOMAIN_ID'
			},
			{
				title: 'Vocabulary',
				data: 'VOCABULARY_ID',
				width: '100px'
			}
		];
		self.searchConceptsOptions = {
			Facets: [
				{
					'caption': 'Vocabulary',
					'binding': function (o) {
						return o.VOCABULARY_ID;
					}
						},
				{
					'caption': 'Class',
					'binding': function (o) {
						return o.CONCEPT_CLASS_ID;
					}
						},
				{
					'caption': 'Domain',
					'binding': function (o) {
						return o.DOMAIN_ID;
					}
						},
				{
					'caption': 'Standard Concept',
					'binding': function (o) {
						return o.STANDARD_CONCEPT_CAPTION;
					}
						},
				{
					'caption': 'Invalid Reason',
					'binding': function (o) {
						return o.INVALID_REASON_CAPTION;
					}
						},
				{
					'caption': 'Has Data',
					'binding': function (o) {
						return o.DENSITY > 0;
					}
						}
					]
		};        

		self.currentServiceUrl = ko.observable(this.services[0].url);
	}

	return appModel;
});
