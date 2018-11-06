// data/log/parser/LogcatThreadTimeParser.js

// logcat -vthreadtime

var LogcatThreadTimeParser = Ext.extend(LogParser, {
    year: String(new Date().getYear() + 1900) + "-",
    parse: function(line) {
        var ltime = "10-17 14:26:20:775".length;
        var pos = 0;
        var time = line.substring(pos, pos + ltime);
        pos += ltime;
        var pid = line.substring(pos, pos + 6).trim();
        pos += 6;
        var tid = line.substring(pos, pos + 6).trim();
        pos += 6;
        var prio = line.substring(pos + 1, pos + 2);
        pos += 2;
        var ltag = line.indexOf(":", pos);
        var tag = line.substring(pos + 1, ltag);
        pos = ltag;
        var msg = line.substring(pos + 2);
        return {
            time: new Date(this.year + time), 
            pid: parseInt(pid), 
            tid: parseInt(tid), 
            prio: "  VDIWEFS".indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    },
    pattern: /^\d{2}-\d{2} (\d{2}:){2}\d{2}[:\.]\d{3} +\d+ +\d+ [VDIWEFS] .+: .*/
});

LogParser.register("logcat-threadtime", LogcatThreadTimeParser);
