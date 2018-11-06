// data/log/LogWorkParser.js

var LogWorkParser = Ext.extend(LogParser, {
    worker: new Worker("data/log/ParseWorker.js"),
    parseAll: function(data, callback) {
        this.worker.onmessage = function(event) {
            callback(event.data);
        };
        this.worker.postMessage({
            minLines: this.minLines, 
            minScore: this.minScore, 
            data: data
        });
    }
});

