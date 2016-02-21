var fortune = require('./fortune.js');

fortune.init(function() {
    fortune.get(function(fort) {
        console.log(['fortune', fort]);
    });
});

