// data/log/parser/LogcatTimeParser.js

// logcat -vtime
// 01-02 08:00:00.729 D/SELinuxMMAC( 1561): Couldn't find install policy /data/security/mac_permissions.xml

var LogcatTimeParser = Ext.extend(LogParser, {
    year: String(new Date().getYear() + 1900) + "-",
    parse: function(line) {
        var ltime = "10-17 14:26:20:775".length;
        var pos = 0;
        var time = line.substring(pos, pos + ltime);
        pos = ltime + 1;
        var prio = line.substring(pos, pos + 1);
        pos += 2;
        var ltag = line.indexOf("(", pos);
        var tag = line.substring(pos, ltag);
        pos = ltag;
        var pid = line.substring(pos + 1, pos + 6).trim();
        pos += 7;
        var msg = line.substring(pos + 2);
        return {
            time: new Date(this.year + time), 
            pid: parseInt(pid), 
            tid: 0, 
            prio: "  VDIWEFS".indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    },
    pattern: /^\d{2}-\d{2} (\d{2}:){2}\d{2}\.\d{3} [VDIWEFS]\/\w+\( *\d+\): .*/
});

LogParser.register("logcat-time", LogcatTimeParser);
