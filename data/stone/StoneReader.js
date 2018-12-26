// data/log/StoneReader.js

var StoneRecord = Ext.data.Record.create([
    'system', 
    'proc', 
    'threads', 
    'memorys', 
    'logsystem', 
    'logmain'
]);

var StoneReader = function(c) {
    c = Ext.apply(c, {
        fields: c.fields || StoneRecord
    });
    StoneReader.superclass.constructor.call(this, c, c.fields);
};

Ext.extend(StoneReader, DataReader, {
    readLines: function(lines) {
        var result = {
            threads: [], 
            memorys: {
                lines: []
            }, 
            logsystem: {
                lines: []
            }, 
            logmain: {
                lines:[]
            }
        }
        var glob = {
            lines: []
        };
        var memorys = null;
        var thread = null;
        var log = null;
        lines.forEach(function(line) {
            if (line == "") {
            } else if (line.startsWith("pid: ")) {
                var tokens = line.split(", ");
                if (!result.proc) {
                    glob.lines.push(line);
                    result.proc = {
                        lines: [], 
                        pid: tokens[0] + ' ' + tokens[1],
                        name: tokens[2].substring(tokens[2].indexOf('>>>', 6) + 4, tokens[2].length - 4),
                        cmdline: tokens[2]
                    }
                }
                var tid = parseInt(tokens[1].substring(5));
                thread = {
                    lines: [], 
                    proc: result.proc,
                    tid: tid, 
                    sysTid: tid, 
                    name: tokens[2].substring(6, tokens[2].indexOf(' >>>', 6))
                };
                result.threads.push(thread);
            } else if (line.startsWith("signal ")) {
                glob.lines.push(line);
                result.proc.time = line;
            } else if (line.startsWith("memory map")) {
                thread = null;
                memorys = result.memorys;
            } else if (line.startsWith("--------- tail end of log")) {
                thread = null;
                memorys = null;
                log = null;
            } else if (line.startsWith("--------- log system")) {
                thread = null;
                memorys = null;
                log = result.logsystem;
            } else if (line.startsWith("--------- log main")) {
                thread = null;
                memorys = null;
                log = result.logmain;
            } else if (line.startsWith("--- --- --- ---")) {
                thread = null;
                memorys = null;
                log = null;
                return;
            }
            (thread || memorys || log || glob).lines.push(line);
        }, this);
        result.system = glob.lines;
        result.memorys = result.memorys.lines.slice(1);
        result.logsystem = result.logsystem.lines;
        result.logmain = result.logmain.lines;
        /*
        var logR = new LogReader({parser: new LogParser()});
        logR.parseAll(result.logsystem, function(records) {
            result.logsystem = records;
        });
        logR.parseAll(result.logmain, function(records) {
            result.logmain = records;
        });
        result.memorys = new MmapReader().readData(result.memorys);
        */
        return [result];
    }
});
