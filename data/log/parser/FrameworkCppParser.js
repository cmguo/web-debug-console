// data/log/parser.js

var FrameworkCppParser = Ext.extend(LogParser, {
    prios: ["", "", "TRACE", "DEBUG", "INFO.", "WARN.", "ERROR"],
    parse: function(line) {
        var ltime = "2018-08-26 00:18:43".length;
        var pos = 1;
        var time = line.substring(pos, pos + ltime);
        pos += ltime + 3; var ltid = line.indexOf("]", pos);
        var tid = line.substring(pos, ltid);
        pos = ltid + 3;
        var prio = line.substring(pos, pos + 5);
        pos += 8;
        var ltag = line.indexOf("]", pos);
        var tag = line.substring(pos, ltag);
        pos = ltag + 2;
        var msg = line.substring(pos);
        return {
            time: new Date(time), 
            pid: 0, 
            tid: parseInt(tid), 
            prio: this.prios.indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    },
    pattern: /^<\d{4}(-\d{2}){2} (\d{2}:){2}\d{2}> \[\d+\] \[\w+\] \[\w+\] .*/
});

LogParser.register("framework-cpp", FrameworkCppParser);
