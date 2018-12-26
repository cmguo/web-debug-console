// data/log/TraceReader.js

var TraceRecord = Ext.data.Record.create([
    'proc', 
    'tid', 
    'name', 
    'sysTid', 
    'jstate',
    'state',
    'top',
    'wait',
]);

var TraceReader = function(c) {
    c = Ext.apply(c, {
        fields: c.fields || TraceRecord
    });
    TraceReader.superclass.constructor.call(this, c, c.fields);
};

Ext.extend(TraceReader, DataReader, {
    readLines: function(lines) {
        if (lines.length == 0 || typeof lines[0] == 'object') {
            return lines;
        }
        var process = [];
        var threads = [];
        var glob = {
            lines: []
        };
        var proc = null;
        var thread = null;
        lines.forEach(function(line) {
            if (line == "") {
            } else if (line.startsWith("----- end")) {
                proc = null;
                thread = null;
            } else if (line.startsWith("-----")) {
                var tokens = line.split(" ");
                var pid = tokens[2];
                var time = tokens[4] + " " + tokens[5];
                proc = {
                    lines: [], 
                    threads: {}, 
                    pid: parseInt(pid),
                    time: time
                };
                process.push(proc);
            } else if (line.startsWith("Cmd line: ")) {
                proc.cmdline = line.substring(10);
            } else if (!proc) {
            } else if (line.startsWith("NATIVE")) {
            } else if (line.startsWith("DALVIK")) {
            } else if (line.startsWith("\"")) {
                var lname = line.indexOf("\" ", 2);
                var tokens = line.substring(lname + 2).split(" ");
                thread = {
                    lines: [],
                    proc: proc,
                    topl: 0, 
                    name: line.substring(1, lname)
                };
                this.applyValues(thread, tokens);
                if (thread.tid) {
                    thread.jstate = tokens[tokens.length - 1];
                    if (proc.threads[thread.tid]) {
                        Ext.apply(proc.threads[thread.tid], thread);
                        thread = proc.threads[thread.tid];
                    } else {
                        proc.threads[thread.tid] = thread;
                    }
                }
                threads.push(thread);
            } else if (!thread) {
            } else if (line.startsWith("  | ")) {
                var tokens = line.split(" ");
                this.applyValues(thread, tokens);
            } else if (line.startsWith("  kernel: ")) {
                if (thread.topl < 1) {
                    thread.top = line.substring(2);
                    thread.topl = 1;
                }
            } else if (line.startsWith("  native: #")) {
                if (thread.topl < 2) {
                    thread.top = line.substring(2);
                    thread.topl = 2;
                }
            } else if (line.startsWith("  #")) {
                if (thread.topl < 2) {
                    thread.top = line.substring(2);
                    thread.topl = 2;
                }
            } else if (line.startsWith("  at ")) {
                if (thread.topl < 3) {
                    thread.top = line.substring(2);
                    thread.topl = 3;
                }
            } else if (line.startsWith("  - waiting")) {
                thread.wait = line.substring(16);
                var h = line.indexOf("held by ");
                if (h > 0) {
                    h = line.substring(h + 8);
                    h = h.split(/[= ]/)[1];
                    if (h != thread.tid) {
                        if (!proc.threads[h]) {
                            proc.threads[h] = {};
                        }
                        thread.heldBy = proc.threads[h];
                        proc.heldBy = thread;
                    } else {
                        thread.heldBy = thread;
                        if (!proc.heldBy) {
                            proc.heldBy = thread;
                        }
                    }
                }
            }
            (thread || proc || glob).lines.push(line);
        }, this);
        return threads;
    }, 
    applyValues: function(item, tokens) {
        tokens.forEach(function(t) {
            var e = t.indexOf("=");
            if (e > 0) {
                item[t.substring(0, e)] = t.substring(e + 1);
            }
        });
    }
});
