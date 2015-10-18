define(['knockout', 'text!./openFDA.html', 'jnj_chart'], function (ko, view, charting) {
	function openFDA(params) {
		var self = this;
		self.model = params.model;
		self.drug = params.drug;
		self.condition = params.condition;
		self.errorFree = ko.observable(true);
		self.outcomesData = [];

		self.isReady = ko.computed(function () {
			if (self.condition() && self.drug()) {
				if (self.condition().length > 0 && self.drug().length > 0) {
					return true;
				}
			}

			return false;
		}, this);

		self.model.selectedConditionConceptId.subscribe(function() {
			self.condition('');
		});

		self.caption = ko.computed(function() {
			if (self.isReady()) {
				return 'OpenFDA data for ' + self.drug() + ' and ' + self.condition();
			}
		},this);

		self.model.drugLabelActiveTab.subscribe(function (value) {
			if (value == 'spo' && self.isReady()) {
				self.loadSeverityData();
				self.loadOutcomes();
			}
		});

		// when the drug changes, lets update the display
		self.drug.subscribe(function (value) {
			self.load();
		});

		self.condition.subscribe(function (value) {
			self.load();
		})

		self.load = function () {
			if (self.isReady()) {
				self.errorFree(true);
				self.loadOutcomes();
				self.loadSeverityData();
			}
		}

		self.setCurrentServiceUrl = function (service) {
			self.currentServiceUrl(service.url);
		}

		self.services = params.services;
		self.currentServiceUrl = params.currentServiceUrl;

		self.loadReactions = function () {
			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug + ')&count=patient.reaction.reactionmeddrapt.exact&limit=20',
				method: 'GET',
				error: function () {
					self.errorFree(false);
				},
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

			var p1 = $.Deferred();
			var p2 = $.Deferred();
			var p3 = $.Deferred();
			var p4 = $.Deferred();
			var p5 = $.Deferred();
			var p6 = $.Deferred();


			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug() + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition() + '%22)&count=seriousnesscongenitalanomali',
				error: function () {
					p1.resolve();
				},
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Congenital Anomalies';
					self.outcomesData.push(result);
					p1.resolve();
				}
			});

			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug() + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition() + '%22)&count=seriousnessdeath',
				error: function () {
					self.errorFree(false);
					p2.resolve();
				},
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Death';
					self.outcomesData.push(result);
					p2.resolve();
				}
			});

			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug() + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition() + '%22)&count=seriousnessdisabling',
				error: function () {
					self.errorFree(false);
					p3.resolve();
				},
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Disabling';
					self.outcomesData.push(result);
					p3.resolve();
				}
			});

			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug() + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition() + '%22)&count=seriousnesshospitalization',
				error: function () {
					self.errorFree(false);
					p4.resolve();
				},
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Hospitalization';
					self.outcomesData.push(result);
					p4.resolve();
				}
			});

			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug() + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition() + '%22)&count=seriousnesslifethreatening',
				error: function () {
					self.errorFree(false);
					p5.resolve();
				},
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Life Threatening';
					self.outcomesData.push(result);
					p5.resolve();
				}
			});

			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug() + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition() + '%22)&count=seriousnessother',
				error: function () {
					self.errorFree(false);
					p6.resolve();
				},
				success: function (data) {
					var result = {};
					result.countValue = data.results[0].count;
					result.conceptName = 'Other';
					self.outcomesData.push(result);
					p6.resolve();
				}
			});

			$.when(p1,p2,p3,p4,p5,p6).then(function () {
				var outcomesDonut = new charting.labeledPie();
				outcomesDonut.render(self.model.mapConceptData(self.outcomesData), "#open-fda-outcomes-chart", 500, 200);
			});
		};

		self.loadSeverityData = function () {
			$.ajax({
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.medicinalproduct:' + self.drug() + ')+AND+(patient.reaction.reactionmeddrapt.exact:%22' + self.condition() + '%22)&count=serious',
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
