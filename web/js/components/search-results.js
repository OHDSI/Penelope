define(['knockout', 'text!./search-results.html', 'knockout.dataTables.binding'], function (ko, view) {
	function penelopeSearchResults(params) {
		var self = this;
		self.model = params.model;
        self.searchResults = params.model.searchResultsConcepts;
                
/*
        this.all = self.searchResults;
        self.data = ko.observableArray();
        this.pageNumber = ko.observable(0);
        this.nbPerPage = 1;
        this.totalPages = ko.computed(function() {
            var div = Math.floor(self.all().length / self.nbPerPage);
            div += self.all().length % self.nbPerPage > 0 ? 1 : 0;
            return div - 1;
        });

        this.paginated = ko.computed(function() {
            var first = self.pageNumber() * self.nbPerPage;
            return self.all.slice(first, first + self.nbPerPage);
        });
        this.hasPrevious = ko.computed(function() {
            return self.pageNumber() !== 0;
        });
        this.hasNext = ko.computed(function() {
            return self.pageNumber() !== self.totalPages();
        });
        this.next = function() {
            if(self.pageNumber() < self.totalPages()) {
                self.pageNumber(self.pageNumber() + 1);
            }
        }

        this.previous = function() {
            if(self.pageNumber() != 0) {
                self.pageNumber(self.pageNumber() - 1);
            }
        }
        
        this.loadData = function() {
                var array = [];
                for (var i = 0; i < 200; i++) {
                    self.all.push(self.randomString());   
                }

        }

        this.randomString = function() {
            var value = "";
            var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for( var i=0; i < 10; i++ ) {
                value += letters.charAt(Math.floor(Math.random() * letters.length));
            }
            return value;		
        }

        this.loadData();        
*/
        
    }

	var component = {
		viewModel: penelopeSearchResults,
		template: view
	};

	ko.components.register('penelope-search-results', component);
	return component;
});
