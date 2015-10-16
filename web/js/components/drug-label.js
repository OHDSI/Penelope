define(['knockout', 'text!./drug-label.html', 'd3', 'jnj_chart', 'colorbrewer', 'lodash', 'knockout.dataTables.binding', 'jquery', 'jquery-ui', 'jquery-scrollTo', 'jquery-sidr'], function (ko, view, d3, jnj_chart, colorbrewer, _) {
	function drugLabel(params) {
		var self = this;
		self.model = params.model;

        self.sidebarClick = function () {
            $('.drug-label-main-container').toggleClass("open-sidebar");
        }
        
        self.evidenceExplorerClick = function() {
            alert("hello world");
        }

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

		self.toggleEvidence = function (data, event) {
			$.sidr('open', 'sidr-right');
		};

                
        // Handles the click logic for the tabbed evidence browser
        self.tabClick = function(item, event) {
            var listItemNode = event.target;
            if (event.target.localName != 'li'){
            	listItemNode = event.target.parentNode;
            }
            var tabName = listItemNode.attributes["tabName"].value;
			switch (tabName) {
                case 'obs':
                    // Handled by sub-components
                    break;
                case 'sci':
                    //self.getLiteratureSummary();
                    break;
                case 'spo':
                    //self.getOpenFDAData();
                    break;
            }
            self.model.drugLabelActiveTab(listItemNode.attributes["tabName"].value);
        }
        
        // Test function for retrieving data from OpenFDA
        /* self.getOpenFDAData = function() {
            $.ajax({
				method: 'GET',
				url: 'https://api.fda.gov/drug/event.json?search=(patient.drug.openfda.spl_set_id:"' + self.model.currentDrugSetId() + '")&count=patient.reaction.reactionmeddrapt.exact',
				dataType: 'json',
				success: function (data) {
                    self.model.openFDAConditionOccurrenceForLabel(data);
				}
			});
        } */
        
        // Handles the in-place search of the table of contents
        self.searchTOC = function() {
            var valThis = $('#searchtoc').val().toLowerCase(),
                length  = $('#searchtoc').val().length;

			if (length > 0) {
            $('#toc li.toc-search-term').each(function () {
                var text  = $(this).text().trim(),
                    textL = text.toLowerCase(),
                    htmlR = text.substr(0,textL.indexOf(valThis)) + '<b id=' + $(this).attr("id") + '>' + text.substr(textL.indexOf(valThis), length) + '</b>' + text.substr(textL.indexOf(valThis) + length);
                    if (textL.indexOf(valThis)>=0) {
						$(this).html(htmlR);
						$(this).show();
                    } else {
						$(this).hide();
                    }
            });
			} else {
				$('.toc-search-term').hide();
			}
        }

        // Handles the click event on the table of contents
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
        
        self.setClinicalCharacterizationActive = function() {
            if ($("#collapseOne").hasClass("in")) {
                //$("#headingOneLink").trigger("click");
                $("#headingTwoLink").trigger("click");
            }
        }
        
		self.loadConditionConceptReports = function () {}
        
        // Subscription to the Condition Concept ID change
        self.model.selectedConditionConceptId.subscribe(function(newValue) {
            if (newValue > 0) {
                // If a condition concept has been selected, ensure that the exposure summary is collapsed
                // and that the clinical characterization section is expanded
                self.setClinicalCharacterizationActive();
                self.model.selectedConditionConceptAndDescendants(null);
                self.getConceptDescendants(self.model.selectedConditionConceptId());
            }
        });
        
        self.getConceptDescendants = function(concept_id) {
            $.ajax({
				type: "GET",
				url: self.model.vocabularyUrl() + "concept/" + concept_id + "/descendants",
				contentType: "application/json; charset=utf-8",
				success: function (result) {
                   self.model.selectedConditionConceptAndDescendants(result); 
                }
            });
        }
        
        self.setSliders = function () {
            $('#sidebar-toggle').sidr({
              name: 'sidr-left',
              side: 'left' // By default
            });

            $('#eeClose').sidr({
              name: 'sidr-right',
              side: 'right',
              displace: false
            });
        }
        
        self.toggleFull = function () {
            $('#sidr-right').toggleClass("sidr-full");
            $('#eeFullScreen').toggleClass("glyphicon-circle-arrow-left").toggleClass("glyphicon-circle-arrow-right");
        }
        
        self.setSliders();
        // hide search terms by default
       	$('.toc-search-term').hide();
    }

	var component = {
		viewModel: drugLabel,
		template: view
	};

	ko.components.register('drug-label', component);
	return component;
});
