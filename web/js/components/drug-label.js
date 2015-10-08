define(['knockout', 'text!./drug-label.html', 'd3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding', 'jquery', 'jquery-ui', 'jquery-scrollTo'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function drugLabel(params) {
		var self = this;
		self.model = params.model;

		self.openEvidenceBrowser = function () {
          $.ajax({
				method: 'GET',
				url: 'js/mock-data/search-results.json', //self.model.services()[0].url + 'conceptset/',
				dataType: 'json',
				success: function (data) {
					//self.conceptSets(data);
                    $('#evidenceBrowserTabs').tabs();
					$('#evidenceExplorer').modal('show');
				}
			});
		}    
        
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
            
            var literatureSeries = [];
            var conditionConceptName = self.model.selectedConditionConceptName(); 
            var literatureEvidenceSummary = self.model.literatureEvidenceSummary();
            for(var i = 0; i < literatureEvidenceSummary.length; i++) { 
                literatureSeries[i] = {"label": literatureEvidenceSummary[i].evidence_type, "values": [literatureEvidenceSummary[i].evidence_count]};
            } 
            
            var data = {
              labels: [conditionConceptName],
              series: literatureSeries
            };

            var chartWidth       = 300,
                barHeight        = 20,
                groupHeight      = barHeight * data.series.length,
                gapBetweenGroups = 10,
                spaceForLabels   = 150,
                spaceForLegend   = 250;

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
            var chart = d3.select(".chart");
            
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
                .attr("class", function(d, i) { return "bar " + literatureEvidenceSummary[i].evidence_type})
                .attr("width", x)
                .attr("height", barHeight - 1)
                .attr("evidence_type", function(d, i) { return literatureEvidenceSummary[i].evidence_type })
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
                .attr('class', function(d, i) { return "bar " + literatureEvidenceSummary[i].evidence_type}) 
                .style('stroke', function (d, i) { return color(i); });

            legend.append('text')
                .attr('class', 'legend')
                .attr('x', legendRectSize + legendSpacing)
                .attr('y', legendRectSize - legendSpacing)
                .text(function (d) { return d.label; });
        }
        
        self.literatureChartBarClick = function(element) {
            var evidenceType = element.attributes["evidence_type"].value;
            $.ajax({
				method: 'GET',
				url: 'http://localhost:8080/WebAPI/LAERTES/evidence/evidencedetails?conditionID=' + self.model.selectedConditionConceptId() + '&drugID=' + self.model.currentDrugConceptId() + '&evidenceType=' + evidenceType,
				dataType: 'json',
				success: function (data) {
                    var returnVal = {"evidence_type": evidenceType, "evidence_count": data.length, "evidence": data};
                    self.model.literatureEvidenceDetails(returnVal);
				}
			});            
        }
        
        self.getLiteratureSummary = function() {
            $.ajax({
				method: 'GET',
				url: 'http://localhost:8080/WebAPI/LAERTES/evidence/evidencesummary?conditionID=' + self.model.selectedConditionConceptId() + ' &drugID=' + self.model.currentDrugConceptId() + '&evidenceGroup=Literature', //'js/mock-data/sci-lit-summary.json', //self.model.services()[0].url + 'conceptset/',
				dataType: 'json',
				success: function (data) {
                    self.model.literatureEvidenceSummary(data);
        	        self.renderLiteratureChart();
                    //self.model.literatureEvidenceResults(data);
				}
			});
        }
        
        // A test method used for loading the observational evidence from Heracles
        self.testReportClick = function() {
            /*
            $.ajax({
                url: "http://hixbeta.jnj.com:8081/WebAPI/OPTUM/cohortresults/121/person", // self.model.services()[0].url + self.model.reportSourceKey() + '/cohortresults/' + self.model.reportCohortDefinitionId() + '/person',
                success: function (data) {
                    //self.model.currentReport(self.model.reportReportName());
                    //self.model.loadingReport(false);

                    if (data.yearOfBirth.length > 0 && data.yearOfBirthStats.length > 0) {
                        var yearHistogram = new jnj_chart.histogram();
                        var histData = {};
                        histData.intervalSize = 1;
                        histData.min = data.yearOfBirthStats[0].minValue;
                        histData.max = data.yearOfBirthStats[0].maxValue;
                        histData.intervals = 100;
                        histData.data = (self.normalizeArray(data.yearOfBirth));
                        yearHistogram.render(self.mapHistogram(histData), "#reportPerson #hist", 460, 195, {
                            xFormat: d3.format('d'),
                            xLabel: 'Year',
                            yLabel: 'People'
                        });
                    }

                    var genderDonut = new jnj_chart.donut();
                    genderDonut.render(self.mapConceptData(data.gender), "#reportPerson #gender", 260, 130, {
                        colors: d3.scale.ordinal()
                            .domain([8507, 8551, 8532])
                            .range(["#1F78B4", "#33A02C", "#FB9A99"]),
                        margin: {
                            top: 5,
                            bottom: 10,
                            right: 150,
                            left: 10
                        }

                    });

                    var raceDonut = new jnj_chart.donut();
                    raceDonut.render(self.mapConceptData(data.race), "#reportPerson #race", 260, 130, {
                        margin: {
                            top: 5,
                            bottom: 10,
                            right: 150,
                            left: 10
                        },
                        colors: d3.scale.ordinal()
                            .domain(data.race)
                            .range(colorbrewer.Paired[10])
                    });

                    var ethnicityDonut = new jnj_chart.donut();
                    ethnicityDonut.render(self.mapConceptData(data.ethnicity), "#reportPerson #ethnicity", 260, 130, {
                        margin: {
                            top: 5,
                            bottom: 10,
                            right: 150,
                            left: 10
                        },
                        colors: d3.scale.ordinal()
                            .domain(data.ethnicity)
                            .range(colorbrewer.Paired[10])
                    });
                    self.model.loadingReport(false);
                }
            });
            */
        }
        
        // Handles the click logic for the tabbed evidence browser
        self.tabClick = function(item, event) {
            var listItemNode = event.target;
            if (event.target.localName != 'li'){
            	listItemNode = event.target.parentNode;
            }
            var tabName = listItemNode.attributes["tabName"].value;
            switch (tabName)
            {
                case 'obs':
                    self.testReportClick();
                    break;
                case 'sci':
                    self.getLiteratureSummary();
                    break;
                case 'toc':
                    // TODO: define action
                    break;
                case 'spo':
                    self.getOpenFDAData();
                    break;
            }
            self.model.drugLabelActiveTab(listItemNode.attributes["tabName"].value);
        }
        
        self.getOpenFDAData = function() {
            $.ajax({
				method: 'GET',
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.openfda.spl_set_id:"' + self.model.currentDrugSetId() + '")&count=patient.reaction.reactionmeddrapt.exact',
				dataType: 'json',
				success: function (data) {
                    self.model.openFDAConditionOccurrenceForLabel(data);
				}
			});
        }
        
        // Handles the in-place search of the table of contents
        self.searchTOC = function() {
            var valThis = $('#searchtoc').val().toLowerCase(),
                lenght  = $('#searchtoc').val().length;

            $('#toc li.toc-search-term').each(function () {
                var text  = $(this).text(),
                    textL = text.toLowerCase(),
                    htmlR = '<b id=' + $(this).attr("id") + '>' + text.substr(0, lenght) + '</b>' + text.substr(lenght);
                (textL.indexOf(valThis) == 0) ? $(this).html(htmlR).show() : $(this).hide();
            });
        }

        self.TOCLinkClick = function(item, event) {
            // Here's some code that will allow us to scroll once we figure out the best way
            // to tag the elements in the page.
            //$("#spl-display").scrollTo($("#test1")); $("#spl-display").scrollLeft(0);
            var scrollToElementId = event.target.attributes["id"].value;
            $("#spl-display").scrollTo($("#" + scrollToElementId)); 
            $("#spl-display").scrollLeft(0);
        }
        
        // Click handler for the links on the drug label
        self.productLabelLinkClick = function(item, event) {
            self.model.selectedConditionConceptId(event.target.attributes["conceptid"].value);
            self.model.selectedConditionConceptName(event.target.attributes["conceptname"].value);
        }                
    }

	var component = {
		viewModel: drugLabel,
		template: view
	};

	ko.components.register('drug-label', component);
	return component;
});
