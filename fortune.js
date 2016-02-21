var fs = require('fs'),
    path = require('path'),
    os = require('os');
function random (low, high) {
        return Math.random() * (high - low) + low;
}

function cumsum(arr) {
    var result = arr.concat(); 
    for(var i=0; i < arr.length; i++) {
        result[i] = arr.slice(0, i + 1)
            .reduce(function(prev, curr){ 
                return prev + curr; 
            });
    }
     
    return result;
}
var Fortune = (function() {

    var self = this;
    self.initialized = false;
    self.path = "datafiles";
    self.cookies = {}; 
    self.defaultPercent = -1;

    var initProb = function() {
        var sum = 0;
        var needProbs = [];
        for ( var fileKey in self.cookies) {
            if ('percent' in self.cookies[fileKey]) {
                if( (sum + self.cookies['percent']) > 100 ) {
                    throw("Percent probability over 100");
                }
                sum = sum + self.cookies['percent'];
            } else {
                needProbs.push(fileKey);
            } 
        }
        while (needProbs.length) {
            var key = needProbs.pop()
            if (needProbs.length > 0) {
                var max = ((100 - sum) / (needProbs.length+1));
                var randPercent = random(0, max).toFixed(2);
                sum += parseFloat(randPercent);
            } else {
                var randPercent = 100 - sum;
            }
            self.cookies[key]['percent'] = parseFloat(randPercent).toFixed(2);
        }
    };
    
    var getFort = function(callback) {
        var count = 0,
            randIndex = getRandomIndex(),
            selectedKey = '';
        for ( fileKey in self.cookies ) {
            if (count == randIndex) {
                selectedKey = fileKey;
                break;
            }
            count++;
        }

        if (selectedKey == '') {
            throw('unable to randomly select fortune');
        }
        getFortunesFromFile(selectedKey, function(forts) {
            var rand = Math.floor(random(0, forts.length-1));   
            callback(prettyify(forts[rand]));
        }); 
        
    }; 
    
    var prettyify = function(str) {
        return str.replace(/\n/gm,os.EOL).replace(/\t/gm, " ");
    };

    var getFortunesFromFile = function(fileKey, callback) {
        fs.open(self.cookies[fileKey]['path'], 'r', function(err, fd) {
            fs.fstat(fd, function(err, stats) {
                var bufferSize=stats.size,
                    buffer=new Buffer(bufferSize);
                fs.read(fd, buffer, 0, buffer.length, null, function(err, bytesRead, buffer) {
                    var data = buffer.toString("utf8", 0, buffer.length).split("%\n"); 
                    fs.close(fd);
                    callback(data);
                });
            });
        });

    };

    var getRandomIndex = function() {
        var probs = [];
        for ( var fileKey in self.cookies) {
            probs.push(parseFloat((self.cookies[fileKey]['percent'] / 100).toFixed(4))); 
        } 
        var randIndex = 0;
        var rand = random(0, 1);
        var sums = cumsum(probs); 
        for ( var index in sums) {
            if (rand >= sums[index]) {
                randIndex++;
            }
        }
        return randIndex; 

    };

    var addFile = function(fileKey, filepath, percent) {
        fileArr = {};
        if (fileKey in self.cookies) {
            fileArr = self.cookies[fileKey]; 
        }
        fileArr['path'] = filepath;
        if (percent != -1) {
             fileArr['percent'] = percent; 
        }

        self.cookies[fileKey] = fileArr;   
    };

    var loadCookies = function(callback) {
        fs.readdir(self.path, function(err, files) { 
            for (var index in files) {
                var fileKey = files[index];
                var filePath = path.join(self.path, fileKey);
                if (fs.statSync(filePath).isFile()) {
                    addFile(fileKey, filePath, self.defaultPercent);
                }
            }
            callback();
        }); 
    }; 

    return {
        'init': function(callback) {
            loadCookies(function() {
                initProb();
                callback();
            });
        },
        'get': function(callback) {
            getFort(callback); 
        }
    };
})();


module.exports = Fortune;
