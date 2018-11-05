// data/log/parser.js

// GLib logger
// 2018-2-15 10:43:46 9958 10318 W GLib+GStreamer External plugin loader failed.

var GLibParser = Ext.extend(LogParser, {
    parse: function(line) {
        var pos = 0;
        var ltime = line.indexOf(" ", 13);;
        var time = line.substring(pos, pos + ltime);
        pos = ltime + 1; var lpid = line.indexOf(" ", pos);
        var pid = line.substring(pos, lpid);
        pos = lpid + 1; var ltid = line.indexOf(" ", pos);
        var tid = line.substring(pos, ltid);
        pos = ltid + 1;
        var prio = line.substring(pos, pos + 1);
        pos += 2;
        var ltag = line.indexOf(" ", pos);
        var tag = line.substring(pos, ltag);
        pos = ltag + 2;
        var msg = line.substring(pos);
        return {
            time: new Date(time), 
            pid: pid, 
            tid: parseInt(tid), 
            prio: "  VDIWEC".indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    },
    pattern: /^\d{4}(-\d{1,2}){2} (\d{1,2}:){2}\d{1,2} \d+ \d+ [VDIWEC] [\w\+]+ .*/
});

LogParser.register("glib", GLibParser);
