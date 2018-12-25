// data/log/parser/LogcatUnknownParser2.js

// 20181112190011-12 19:00:12.614 I/MiSysSrv( 1660): >>>MI_IMPL_AUDIO_GetAttr[553] 

var LogcatUnknownParser2 = Ext.extend(LogParser, {
    parse: function(line) {
        var ltime = "20181112190011-17 14:26:20:775".length;
        var pos = 0;
        var time = line.substring(pos, pos + 4) + "-" + line.substring(pos + 12, pos + ltime);
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
    pattern: /^\d{14}-\d{2} (\d{2}:){2}\d{2}\.\d{3} [VDIWEFS]\/.+\( *\d+\): .*/
});

LogParser.register("logcat-unknown2", LogcatUnknownParser2);
