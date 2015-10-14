define(['knockout', 'text!./openFDA.html', 'jnj_chart'], function (ko, view, charting) {
	function openFDA(params) {
		var self = this;
		self.model = params.model;
		self.drug = params.drug;
		self.condition = params.condition;

		self.outcomesData = [];

		self.model.drugLabelActiveTab.subscribe(function (value) {
			if (value == 'spo') {
				self.loadSeverityData();
				self.loadOutcomes();
			}
		});

		self.setCurrentServiceUrl = function (service) {
			self.currentServiceUrl(service.url);
		}

		self.services = params.services;
		self.currentServiceUrl = params.currentServiceUrl;

		self.loadReactions = function () {
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

		self.loadOutcomes = function () {
			self.outcomesData = [];

			var q1 = $.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition + '%22)&count=seriousnesscongenitalanomali',
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Congenital Anomali';
					self.outcomesData.push(result);
				}
			});

			var q2 = $.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition + '%22)&count=seriousnessdeath',
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Death';
					self.outcomesData.push(result);
				}
			});

			var q3 = $.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition + '%22)&count=seriousnessdisabling',
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Disabling';
					self.outcomesData.push(result);
				}
			});

			var q4 = $.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition + '%22)&count=seriousnesshospitalization',
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Hospitalization';
					self.outcomesData.push(result);
				}
			});

			var q5 = $.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition + '%22)&count=seriousnesslifethreatening',
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Life Threatening';
					self.outcomesData.push(result);
				}
			});

			var q6 = $.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition + '%22)&count=seriousnessother',
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Other';
					self.outcomesData.push(result);
				}
			});

			$.when(q1, q2, q3, q4, q5, q6).done(function () {
					var outcomesDonut = new charting.labeledPie();
					outcomesDonut.render(self.model.mapConceptData(self.outcomesData), "#open-fda-outcomes-chart", 500, 200);
			});
		};

		self.loadSeverityData = function () {
			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition + '%22)&count=serious',
				method: 'GET',
				success: function (data) {
					var options = {};
					var severityDonut = new charting.labeledPie();

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

					severityDonut.render(self.model.mapConceptData(results), "#open-fda-severity-chart", 500, 200);
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
