// data/log/parser/LogcatBriefParser.js

// logcat -vbrief

var LogcatBriefParser = Ext.extend(LogParser, {
    parse: function(line) {
        var pos = 0;
        var prio = line.substring(pos, pos + 1);
        pos += 2;
        var ltag = line.indexOf("(", pos);
        var tag = line.substring(pos, ltag);
        pos = ltag;
        var pid = line.substring(pos + 1, pos + 6).trim();
        pos += 7;
        var msg = line.substring(pos + 2);
        return {
            time: 0, 
            pid: parseInt(pid), 
            tid: 0, 
            prio: "  VDIWEFS".indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    },
    pattern: /^[VDIWEFS]\/.+\( *\d+\): .*/
});

LogParser.register("logcat-brief", LogcatBriefParser);
