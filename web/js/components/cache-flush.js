define(['knockout', 'text!./cache-flush.html', 'lscache', 'datatables'], function (ko, view, lscache, datatables) {
	function cacheFlush(params) {
		var self = this;
        
        self.clearCache = function () {
            var msg = $('#cache-clear-msg');
            try {
                lscache.flush();
                msg.html('Cache cleared successfully!');
            }
            catch (e) {
                msg.html('Cache clear FAILED: ' + e.message);
            }
            
        }
        
        self.clearCache();
	}

	var component = {
		viewModel: cacheFlush,
		template: view
	};

	ko.components.register('cache-flush', component);
	return component;
});