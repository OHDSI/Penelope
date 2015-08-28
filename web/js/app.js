define([
	'jquery',
	'knockout',
	'components/webapi-configuration',
	'bootstrap',
	'css!styles/app'
], function ($, ko) {

	var appModel = function () {
        // Search settings
        this.currentView = ko.observable();
        this.currentSearch = ko.observable();
        
        // Example model settings
		this.appHeading = ko.observable('Welcome to Penelope');
		this.appBody = ko.observable('Personalized Exploratory Navigation and Evaluation for Labels Of Product Effects');

		// configure services to include at least one valid OHDSI WebAPI endpoint
		this.services = [
			{
				name: 'Local',
				url: 'http://hixbeta.jnj.com:8081/WebAPI/',
				dialect: ko.observable('loading'),
				version: ko.observable('loading')
			}
		];

		this.currentServiceUrl = ko.observable(this.services[0].url);
	}

	return appModel;
});
