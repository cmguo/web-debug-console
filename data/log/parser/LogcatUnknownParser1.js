// data/log/parser/LogcatUnknownParser1.js

// unknown 1
// 18;38;24D/DownloadListAdapter( 3812): combineDatas

var LogcatUnknownParser1 = Ext.extend(LogParser, {
    parse: function(line) {
        var ltime = "18;38;24".length;
        var pos = 0;
        var time = line.substring(pos, pos + ltime).replace(/;/g, ":");
        pos += ltime;
        var prio = line.substring(pos + 0, pos + 1);
        pos += 2;
        var ltag = line.indexOf("(", pos);
        var tag = line.substring(pos, ltag);
        pos = ltag;
        var pid = line.substring(pos + 1, pos + 6).trim();
        pos += 7;
        var msg = line.substring(pos + 2);
        return {
            time: new Date("2001-01-01 " + time), 
            pid: parseInt(pid), 
            tid: 0, 
            prio: "  VDIWEFS".indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    },
    pattern: /^\d{2};\d{2};\d{2}[VDIWEFS]\/.+\( *\d+\): .*/
});

LogParser.register("logcat-unknown1", LogcatUnknownParser1);
