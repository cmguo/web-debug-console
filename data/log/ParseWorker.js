// data/log/ParseWorker.js

importScripts("Ext.js");
importScripts("LogParser.js");
importScripts("parser/LogcatThreadTimeParser.js");
importScripts("parser/LogcatTimeParser.js");
importScripts("parser/LogcatBriefParser.js");
importScripts("parser/FrameworkCppParser.js");
importScripts("parser/GLibParser.js");
importScripts("parser/LogcatUnknownParser1.js");
importScripts("parser/LogcatUnknownParser2.js");

self.addEventListener('message', function (event) {
    var data = event.data;
    var parser = new LogParser(data);
    parser.parseAll(data.data, function(state) {
        self.postMessage(state);
    });
}); 
