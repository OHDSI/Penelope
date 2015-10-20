define(['knockout', 'text!./cohort-study.html', 'knockout.dataTables.binding'], function (ko, view, _) {
	function cohortStudy(params) {
		var self = this;
		self.model = params.model;
        self.studyType = params.studyType;
		self.datatables = {};
        self.loading = ko.observable(false);
		self.hasDetailError = ko.observable(false);
		self.detailErrorMsg = ko.observable('');
        
		self.render = function () {
            self.loading(true);    
            self.resetDetailError();
            var exposureCohortList = self.model.currentExposureCohortId();
            $.ajax({
				method: 'GET',
				url: self.model.evidenceUrl() + 'study/' + self.model.currentExposureCohortId(),
				contentType: "application/json; charset=utf-8",
				success: function (data) {
                    self.loading(false);   
                    var table_data = data.map(function(d, i) {
                        if (d.studyType == self.studyType)
                            return d;
                    });

					// Remove the NULL values from the subset
					var table_data = $.grep(table_data, function(n, i) {
						return n != null
					});
                    
                    var datatable = $('#cohort_study_' + self.studyType).DataTable({
							order: [0, 'desc'],
							dom: 'T<"clear">lfrtip',
							data: table_data,
							columns: [
                                {
									data: 'studyName',
									"fnCreatedCell": function (nTd, sData, oData, iRow, iCol) {
										$(nTd).html("<a target='_blank' href='" + oData.studyUrl + "'>"+oData.studyName+"</a>")
                                    }
								}
							],
							pageLength: 10,
							lengthChange: false,
							deferRender: true,
							destroy: true
						});
				    self.datatables['cohort_study_' + self.studyType] = datatable;    
                },
				error: function (data, textStatus, errorThrown) {
					self.loading(false);
					self.hasDetailError(true);
					self.detailErrorMsg("An error occurred: " + textStatus);
				}                
            });            
		}

        self.model.currentExposureCohortId.subscribe(function(newValue) {
        	if (newValue > 0) {
				self.evaluateRender();        		
        	}
        });

        self.evaluateRender = function() {
            try
            {
                if (self.model.currentExposureCohortId() > 0){
                    self.render();
                }
                else{
                    self.loading(true);
                }                
            }
            catch (e)
            {
                self.loading(true);
            }

        }

        self.resetDetailError = function () {
			self.hasDetailError(false);
			self.detailErrorMsg('');
		}

		self.evaluateRender();
	}

	var component = {
		viewModel: cohortStudy,
		template: view
	};

	ko.components.register('cohort-study', component);
	return component;
});