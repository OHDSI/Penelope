define(['knockout', 'text!./scientific-literature.html', 'd3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding', 'jquery', 'jquery-ui', 'jquery-scrollTo'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function scientificLiterature(params) {
		var self = this;
		self.model = params.model;
        self.loadingSummary = ko.observable(false);
        self.loadingDetails = ko.observable(false);
        self.hasDetailError = ko.observable(false);
        self.detailErrorMsg = ko.observable('');

        // Taken from http://bl.ocks.org/erikvullings/51cc5332439939f1f292
        self.renderLiteratureChart = function() {
            /*
            var testData = {
              labels: [
                'depression', '<condition 2>', '<condition 3>',
                '<condition 4>', '<condition 5>', '<condition 6>'
              ],
              series: [
                {
                  label: 'PubMed',
                  values: [4, 8, 15, 16, 23, 42]
                },
                {
                  label: 'Clinical Trials',
                  values: [12, 43, 22, 11, 73, 25]
                },
                {
                  label: 'Other',
                  values: [31, 28, 14, 8, 15, 21]
                },]
            };
            */
 
            // If this property is not set, bail out
            if (self.model.literatureEvidenceSummary == undefined) 
                return; 
            
            if (self.model.literatureEvidenceSummary().length <= 0)
            {
                self.showNoResults();   
            }
            else
            {
                $("#sciListNoResults").removeClass("visible").addClass("hidden");
                self.resetCharts();
                var pubMedSeries = [];
                var semMedDBSeries = [];
                var literatureEvidenceSummary = self.model.literatureEvidenceSummary();
                for(var i = 0; i < literatureEvidenceSummary.length; i++) {
                    var literatureObject = {"label": literatureEvidenceSummary[i].evidence_type_suffix, "values": [literatureEvidenceSummary[i].evidence_count], "evidence_type": literatureEvidenceSummary[i].evidence_type}; 
                    switch(literatureEvidenceSummary[i].evidence_type_root.toUpperCase())
                    {
                        case "PUBMED":
                            pubMedSeries[pubMedSeries.length] = literatureObject;
                            break;
                        case "SEMMEDDB":
                            semMedDBSeries[semMedDBSeries.length] = literatureObject;
                            break;
                    }
                } 

                if (pubMedSeries.length > 0)
                {
                    var pubMedData = {
                      labels: ["PUBMED"],
                      series: pubMedSeries
                    };
                    self.renderBarChart(pubMedData, ".pubmed-chart");
                }
                
                if (semMedDBSeries.length > 0)
                {
                    var semMedDBData = {
                      labels: ["SemMedDB"],
                      series: semMedDBSeries
                    };
                    self.renderBarChart(semMedDBData, ".semmeddb-chart");
                }

            }
        }
        
        // Handles the literature drill down to Laertes
        self.literatureChartBarClick = function(element) {
            self.loadingDetails(true);
            self.resetDetailError();
            var evidenceType = element.attributes["evidence_type"].value;
            $.ajax({
				method: 'GET',
				url: self.model.evidenceUrl() + 'evidencedetails?conditionID=' + self.model.selectedConditionConceptId() + '&drugID=' + self.model.currentDrugConceptId() + '&evidenceType=' + evidenceType,
				dataType: 'json',
				success: function (data) {
                    self.loadingDetails(false);
                    var returnVal = {"evidence_type": evidenceType, "evidence_count": data.length, "evidence": data};
                    self.model.literatureEvidenceDetails(returnVal);
				},
                error: function(data, textStatus, errorThrown) {
                    self.loadingDetails(false);
                    self.hasDetailError(true);
                    self.detailErrorMsg("An error occurred: " + textStatus);
                }
			});            
        }
        
        // Retrieves the literature summary from Laertes
        self.getLiteratureSummary = function() {
            self.loadingSummary(true);
            self.model.literatureEvidenceDetails(null);
            $.ajax({
				method: 'GET',
				url: self.model.evidenceUrl() + 'evidencesummary?conditionID=' + self.model.selectedConditionConceptId() + ' &drugID=' + self.model.currentDrugConceptId() + '&evidenceGroup=Literature',
				dataType: 'json',
				success: function (data) {
                    self.loadingSummary(false);
                    var litSummary = data.map(function(d, i) {
                        var evidenceType = d.evidence_type.toUpperCase().trim();
                        var evidenceTypeSuffix;
                        var evidenceTypeFormatted = undefined;
                        if (evidenceType.indexOf("MEDLINE_MESH") == 0) {
                            evidenceTypeFormatted = "PUBMED";
                        }
                        if (evidenceType.indexOf("MEDLINE_SEMMEDDB") == 0) {
                            evidenceTypeFormatted = "SemMedDB";
                        }
                        var splitEvidenceName = evidenceType.split("_");
                        if (splitEvidenceName.length > 0) {
                            switch (splitEvidenceName[splitEvidenceName.length -1]){
                                case "CLINTRIAL":
                                    evidenceTypeSuffix = "Clinical Trials"
                                    break;
                                case "CR":
                                    evidenceTypeSuffix = "Case Reports"
                                    break;
                                case "OTHER":
                                    evidenceTypeSuffix = "Other"
                                    break;
                            }
                        }
                        
                        return {
                            "evidence_count": d.evidence_count,
                            "evidence_group_name": d.evidence_group_name,
                            "evidence_id": d.evidence_id,
                            "evidence_type": d.evidence_type,
                            "evidence_type_root": evidenceTypeFormatted,
                            "evidence_type_suffix": evidenceTypeSuffix,
                            "modality": d.modality
                        }
                    });
                    self.model.literatureEvidenceSummary(litSummary);
        	        self.renderLiteratureChart();
				}
			});
        }        
        
        self.resetDetailError = function() {
            self.hasDetailError(false);
            self.detailErrorMsg('');
        }
        
        self.renderBarChart = function(data, chartElement) {
            var chartWidth       = 300,
                barHeight        = 20,
                groupHeight      = barHeight * data.series.length,
                gapBetweenGroups = 10,
                spaceForLabels   = 100,
                spaceForLegend   = 150;

            // Zip the series data together (first values, second values, etc.)
            var zippedData = [];
            for (var i=0; i<data.labels.length; i++) {
              for (var j=0; j<data.series.length; j++) {
                zippedData.push(data.series[j].values[i]);
              }
            }

            // Color scale
            var color = d3.scale.category20();
            var chartHeight = barHeight * zippedData.length + gapBetweenGroups * data.labels.length;

            var x = d3.scale.linear()
                .domain([0, d3.max(zippedData)])
                .range([0, chartWidth]);

            var y = d3.scale.linear()
                .range([chartHeight + gapBetweenGroups, 0]);

            var yAxis = d3.svg.axis()
                .scale(y)
                .tickFormat('')
                .tickSize(0)
                .orient("left");

            // Specify the chart area and dimensions
            var chart = d3.select(chartElement);
            
            // Remove any existing elements inside the SVG
            chart.selectAll("g").remove();

            // Build out the chart
            chart.attr("width", spaceForLabels + chartWidth + spaceForLegend)
                .attr("height", chartHeight);

            // Create bars
            var bar = chart.selectAll("g")
                .data(zippedData)
                .enter().append("g")
                .attr("transform", function(d, i) {
                  return "translate(" + spaceForLabels + "," + (i * barHeight + gapBetweenGroups * (0.5 + Math.floor(i/data.series.length))) + ")";
                });

            // Create rectangles of the correct width
            bar.append("rect")
                //.attr("fill", function(d,i) { return color(i % data.series.length); })
                .attr("class", function(d, i) { return "bar " + data.series[i].evidence_type })
                .attr("width", x)
                .attr("height", barHeight - 1)
                .attr("evidence_type", function(d, i) { return data.series[i].evidence_type }) // { return literatureEvidenceSummary[i].evidence_type })
                .on('click', function (d) {
                    self.literatureChartBarClick(this);
				});

            // Add text label in bar
            bar.append("text")
                .attr("x", function(d) { return x(d) - 3; })
                .attr("y", barHeight / 2)
                .attr("fill", "red")
                .attr("dy", ".35em")
                .text(function(d) { return d; });

            // Draw labels
            bar.append("text")
                .attr("class", "label")
                .attr("x", function(d) { return - 10; })
                .attr("y", groupHeight / 2)
                .attr("dy", ".35em")
                .text(function(d,i) {
                  if (i % data.series.length === 0)
                    return data.labels[Math.floor(i/data.series.length)];
                  else
                    return ""});

            chart.append("g")
                  .attr("class", "y axis")
                  .attr("transform", "translate(" + spaceForLabels + ", " + -gapBetweenGroups/2 + ")")
                  .call(yAxis);

            // Draw legend
            var legendRectSize = 18,
                legendSpacing  = 4;

            var legend = chart.selectAll('.legend')
                .data(data.series)
                .enter()
                .append('g')
                .attr('transform', function (d, i) {
                    var height = legendRectSize + legendSpacing;
                    var offset = -gapBetweenGroups/2;
                    var horz = spaceForLabels + chartWidth + 40 - legendRectSize;
                    var vert = i * height - offset;
                    return 'translate(' + horz + ',' + vert + ')';
                });

            legend.append('rect')
                .attr('width', legendRectSize)
                .attr('height', legendRectSize)
                //.style('fill', function (d, i) { return color(i); })
                .attr('class', function(d, i) { return "bar " + data.series[i].evidence_type}) 
                .style('stroke', function (d, i) { return color(i); });

            legend.append('text')
                .attr('class', 'legend')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text(function (d) { return d.label; });            
        }
        
        self.showNoResults = function() {
            self.resetCharts();
            $("#sciListNoResults").removeClass("hidden").addClass("visible");
        }
        
        self.resetCharts = function() {
            $(".pubmed-chart").empty();
            $(".semmeddb-chart").empty();
        }
        
        self.model.selectedConditionConceptId.subscribe(function(newValue) {
            if (newValue > 0) {
                self.evaluateRender();
            }
        });

        self.model.currentDrugConceptId.subscribe(function(newValue) {
            if (newValue != undefined) {
                self.evaluateRender();
            }
        });        
        
        self.evaluateRender = function() {
            try
            {
                if (self.model.currentDrugConceptId() > 0 && self.model.selectedConditionConceptId() > 0){
                    self.getLiteratureSummary();
                }
                else{
                    self.loadingSummary(true);
                    self.loadingDetails(false);
                }                
            }
            catch (e)
            {
                self.loadingSummary(true);
                self.loadingDetails(false);
            }            
        }
    }

	var component = {
		viewModel: scientificLiterature,
		template: view
	};

	ko.components.register('scientific-literature', component);
	return component;
});