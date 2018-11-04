// data/log.js

var LogRecord = Ext.data.Record.create([
    {name: 'time', convert: function(v) { return new Date(v); } }, 
    'pid', 
    'tid', 
    {name: 'priority'}, 
    'tag', 
    'msg', 
    'line'
]);

var LogStore = function(c) {
    c = Ext.applyIf(c || {}, {
        fields: LogRecord
    });
    LogStore.superclass.constructor.call(this, c);
};

Ext.extend(LogStore, Ext.data.JsonStore, {
    reload: function(options) {
        for (var p in this.baseParams) {
            var v = this.baseParams[p];
            if (v == '')
                this.delFilter(p);
            else
                this.addFilter(p, v, true, false);
        }
    }, 
    put: function(record) {
        convert_record(this.recordType, record);
        record = new Ext.data.Record(record);
        if (this.filterFn && !this.filterFn(record)) {
            if(this.snapshot){
                record.join(this);
                this.snapshot.add(record);
            }
            return;
        }
        this.add(record);
    },
    parse: function(line) {
        return Ext.decode(line);
    }
});

var StreamLogStore = function(c) {
    c = Ext.applyIf(c || {}, {
        url: 'http://127.0.0.1:8080/log?w=&f=json'
    });
    StreamLogStore.superclass.constructor.call(this, c);
};

Ext.extend(StreamLogStore, LogStore, {
    load: function(options) {
        options = options || {};
        if (this.fireEvent("beforeload", this, options) === false) {
            return false;
        }
        this.storeOptions(options);
        var p = Ext.apply(options.params || {}, this.baseParams);
        var oReq = new XMLHttpRequest();
        var state = {
            store: this, 
            position: 0,
            parse: function(response) {
                var end = response.indexOf('}\n', this.position);
                while (end > 0) {
                    var line = response.substring(this.position, end + 1);
                    line = line.replace(new RegExp("\n", 'g'), "\\n");
                    try {
                        var result = this.store.parse(line);
                        result.line = line;
                        this.store.put(result);
                    } catch (err) {
                        Ext.MessageBox.alert("错误", err);
                    } finally {
                        this.position = end + 2;
                        end = response.indexOf('}\n', this.position);
                    }
                }
            }
        };
        this.removeAll();
        this.put({
            line: '0 0 0 D --- http://',
            time: new Date().getTime(),
            pid: 0, 
            tid: 0, 
            priority: 7,
            tag: '---',
            msg: this.url
        });
        oReq.onreadystatechange = function() {
            if (this.readyState > 2) {
                state.parse(this.responseText);
            }
        }
        if (this.oReq)
            this.oReq.abort();
        this.oReq = oReq;
        oReq.open("get", this.url, true);
        oReq.send();
        return true;
    }
});

var LogReader = function(c) {

}

Ext.extend(LogReader, Ext.data.DataReader, {
    readRecords: function() {
    }
});

var TextLogStore = function(c) {
    var year = String(new Date().getYear() + 1900) + "-";
    var parseThreadTime = function(line) {
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
            time: new Date(year + time).getTime(), 
            pid: parseInt(pid), 
            tid: parseInt(tid), 
            priority: "  VDIWEFS".indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    };
    parseThreadTime.pattern = /^\d{2}-\d{2} (\d{2}:){2}\d{2}[:\.]\d{3} +\d+ +\d+ [VDIWEFS] \w+: .*/;
    var parseBrief = function(c) {
        var pos = 0;
        var prio = line.substring(pos, pos + 1);
        pos += 2;
        var ltag = line.indexOf("(", pos);
        var tag = line.substring(pos + 1, ltag);
        pos = ltag;
        var pid = line.substring(pos + 1, pos + 6).trim();
        pos += 7;
        var msg = line.substring(pos + 2);
        return {
            time: 0, 
            pid: parseInt(pid), 
            tid: 0, 
            priority: "  VDIWEFS".indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    }
    parseBrief.pattern = /^[VDIWEFS]\/\w+\( *\d+\): .*/;
    var parseUnknown1 = function(line) {
        //18;38;24D/DownloadListAdapter( 3812): combineDatas
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
            time: new Date("2001-01-01 " + time).getTime(), 
            pid: parseInt(pid), 
            tid: 0, 
            priority: "  VDIWEFS".indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    }
    parseUnknown1.pattern = /^\d{2};\d{2};\d{2}[VDIWEFS]\/\w+\( *\d+\): .*/;
    c == c || {};
    c.parseState = {
        lines: [], 
        parsers: [{
            parser: parseThreadTime, 
            score: 0
        }, {
            parser: parseBrief,
            score: 0
        }, {
            parser: parseUnknown1,
            score: 0
        }]
    };
    TextLogStore.superclass.constructor.call(this, c);
}

Ext.extend(TextLogStore, LogStore, {
    load: function(options) {
        if (this.loaded)
            return;
        if (this.fireEvent("beforeload", this, options) === false) {
            return false;
        }
        this.loadData(this.datasrc, function(response) {
            var records = this.parseAll(response);
            this.clearFilter(true);
            this.insert(0, records.reverse());
            this.loaded = true;
            this.fireEvent("load", this, records, options);
        }.bind(this));
    }, 
    loadNext: function() {
        if (!this.datasrc.next) {
            Ext.MessageBox.alert("错误", "no more segments!");
            return;
        }
        this.datasrc = this.datasrc.next;
        this.loaded = false;
        this.load({});
    }, 
    parseAll: function(response) {
        var lines = Array.isArray(response) ? response : response.split('\n');
        var items = [];
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            if (line == "") continue;
            try {
                var result = this.parse(line);
                if (Array.isArray(result)) {
                    items = items.concat(result);
                    continue;
                }
                convert_record(this.recordType, result);
                result.line = line;
                result = new Ext.data.Record(result);
                items.push(result);
            } catch (err) {
                Ext.MessageBox.alert("错误", line + "\n" + err);
            }
        }
        return items;
    }, 
    parse: function(line) {
        this.parseState.lines = this.parseState.lines.concat(line);
        var max = { score: 0 };
        this.parseState.parsers.forEach(function (o) {
            if (o.parser.pattern.test(line))
                o.score += 1;
            if (o.score > max.score)
                max = o;
        });
        if (this.parseState.lines.length > 10 && max.score > 4) {
            this.parse = max.parser;
            return this.parseAll(this.parseState.lines);
        } else if (this.parseState.lines.length > 20) {
            this.parse = function() { return [] };
            throw "can't detech log format";
        }
        return [];
    }
});

var FileLogStore = function(c) {
    FileLogStore.superclass.constructor.call(this, c);
}

Ext.extend(FileLogStore, TextLogStore, {
    loadData: function(data, response) {
        var reader = new FileReader();
        reader.onload = function(e) {
            response(e.target.result);
        };
        reader.readAsText(data.file)
    }
});

var EntryLogStore = function(c) {
    EntryLogStore.superclass.constructor.call(this, c);
}

Ext.extend(EntryLogStore, TextLogStore, {
    loadData: function(data, callback) {
        data.entry.getText(callback);
    }
});

var HttpLogStore = function(c) {
    HttpLogStore.superclass.constructor.call(this, c);
}

Ext.extend(HttpLogStore, TextLogStore, {
    loadData: function(data, callback) {
        Ext.Ajax.request(Ext.apply({
            url: data.url, 
            success: function(response) {
                callback(response.responseText);
            }
        }, this.options));
    }
});
