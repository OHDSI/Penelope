define(['knockout', 'text!./openFDA.html', 'jnj_chart'], function (ko, view, charting) {
	function openFDA(params) {
		var self = this;
		self.model = params.model;
		self.drug = params.drug;
		self.condition = params.condition;

		self.model.drugLabelActiveTab.subscribe(function(value) {
			if (value == 'spo') {
				self.loadSeverityData();
				self.loadReactions();
			}
		});

		self.setCurrentServiceUrl = function (service) {
			self.currentServiceUrl(service.url);
		}

		self.services = params.services;
		self.currentServiceUrl = params.currentServiceUrl;

		self.loadReactions = function() {
			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')&count=patient.reaction.reactionmeddrapt.exact&limit=20',
				method: 'GET',
				success: function (data) {
					var options = {};
					var reactionsDonut = new charting.donut();

					var results = [];
					for (var i = 0; i < data.results.length; i++) {
						var result = {};
						result.countValue = data.results[i].count;
						result.conceptName = data.results[i].term;
						results.push(result);
					}

					reactionsDonut.render(self.model.mapConceptData(results), "#open-fda-reactions-chart", 300, 300, {
						margin: {
							top: 5,
							left: 5,
							right: 100,
							bottom: 5
						}
					});
				}
			});

		}

		self.loadSeverityData = function () {
			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition + '%22)&count=serious',
				method: 'GET',
				success: function (data) {
					var options = {};
					var severityDonut = new charting.donut();

					var results = [];
					for (var i = 0; i < data.results.length; i++) {
						var result = {};
						result.countValue = data.results[i].count;
						if (data.results[i].term == 1) {
							result.conceptName = 'Serious'
						} else if (data.results[i].term == 2) {
							result.conceptName = 'Non-Serious'
						}
						results.push(result);
					}

					severityDonut.render(self.model.mapConceptData(results), "#open-fda-severity-chart", 300, 300, {
						margin: {
							top: 5,
							left: 5,
							right: 100,
							bottom: 5
						}
					});
				}
			});
		};
	}

	var component = {
		viewModel: openFDA,
		template: view
	};

	ko.components.register('open-fda', component);
	return component;
});
