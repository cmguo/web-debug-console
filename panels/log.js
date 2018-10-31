// log.js

var LogStore = function(c) {
    c = Ext.applyIf(c || {}, {
        fields: [ {name: 'time', convert: function(v) { return new Date(v); } }, 'pid', 'tid', 'tag', 'msg']
    });
    LogStore.superclass.constructor.call(this, c);
};

Ext.extend(LogStore, Ext.data.JsonStore, {
    reload: function(options) {
        for (var p in this.baseParams) {
            var v = this.baseParams[p];
            if (v == '')
                this.clearFilter(p);
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
    },
    addFilter: function(property, value, anyMatch, caseSensitive){
        this.filters = this.filters || {};
        if (typeof value != "function") {
            value = String(value);
            var regex = new RegExp((anyMatch === true ? '' : '^') 
                + Ext.escapeRe(value) + (anyMatch === true ? '' : '$'), 
                caseSensitive ? '' : 'i');
            value = regex.test.bind(regex);
        }
        this.filters[property] = value;
        this.updateFilter();
    },
    clearFilter: function(property) {
        delete this.filters[property];
        this.updateFilter();
    },
    toggleFilter: function(property, value, anyMatch, caseSensitive) {
        if (this.filters && this.filters[property])
            this.clearFilter(property);
        else
            this.addFilter(property, value, anyMatch, caseSensitive);
    },
    updateFilter: function() {
        var filters = this.filters;
        this.filterFn = function(r) {
            for (var f in filters) {
                if (!filters[f](r.data[f])) {
                    return false;
                }
            }
            return true;
        }
        this.filterBy(this.filterFn);
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

var TextLogStore = function(c) {
    TextLogStore.superclass.constructor.call(this, c);
}

Ext.extend(TextLogStore, LogStore, {
    load: function(options) {
        if (this.loaded)
            return;
        this.loadData(function(response) {
            this.add(this.parseAll(response));
            this.loaded = true;
        }.bind(this));
    }, 
    parseAll: function(response) {
        var lines = response.split('\n');
        var items = [];
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            try {
                var result = this.parse(line);
                convert_record(this.recordType, result);
                result = new Ext.data.Record(result);
                items.push(result);
            } catch (err) {
                Ext.MessageBox.alert("错误", err);
            }
        }
        return items;
    }, 
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
            time: new Date(time), 
            pid: parseInt(pid), 
            tid: parseInt(tid), 
            priority: "  VDIWEFS".indexOf(prio), 
            tag: tag, 
            msg: msg
        };
    }
});

var FileLogStore= function(c) {
    FileLogStore.superclass.constructor.call(this, c);
}

Ext.extend(FileLogStore, TextLogStore, {
    loadData: function(response) {
        var reader = new FileReader();
        reader.onload = function(e) {
            response(e.target.result);
        };
        reader.readAsText(this.file)
    }
});

var ZipEntryLogStore = function(c) {
    ZipEntryLogStore.superclass.constructor.call(this, c);
}

Ext.extend(ZipEntryLogStore, TextLogStore, {
    loadData: function(callback) {
        this.entry.getData(new zip.TextWriter(), function(text) {
            callback(text);
        });
    }
});

var HttpLogStore = function(c) {
    HttpLogStore.superclass.constructor.call(this, c);
}

Ext.extend(HttpLogStore, TextLogStore, {
    loadData: function(callback) {
        Ext.Ajax.request(Ext.apply({
            url: this.url2, 
            success: function(response) {
                callback(response.responseText);
            }
        }, this.options));
    }
});

var LogPanel = function(c) {
    var logStore = c.store || new StreamLogStore();
    c = Ext.applyIf(c || {}, {
        store: logStore, 
        tbar: [
            '搜索消息: ', ' ',
            new Ext.app.SearchField({
                store: logStore,
                width: 320, 
                height: 300, 
                paramName: "msg"
            }), {
                xtype: "button", 
                text: "清空", 
                handler: function() {
                    logStore.removeAll();
                }
            }
        ]
    });
    LogPanel.superclass.constructor.call(this, c);
}

Ext.extend(LogPanel, Ext.grid.GridPanel, {
    title: '日志', 
    region: 'center',
    bodyBorder: false,
    autoWidth: true, 
    columns: [{
        id: 'time', 
        xtype: 'date', 
        header : '时间', 
        renderer: Ext.util.Format.dateRenderer('m-d h:i:s.u'),
        width: 140
    }, {
        id: 'pid', 
        header : '进程', 
        width: 60
    }, {
        id: 'tid', 
        header : '线程', 
        width: 60
    }, {
        id: 'tag', 
        header : '模块', 
        width: 160
    }, {
        id: 'msg', 
        header: '消息', 
        width: 600
    }], 
    viewConfig: {
        getRowClass: function(record, index) {
            return 'log-' + record.data.priority;
        }
    },
    set_url: function(url) {
        url = url + "log?w=&f=json";
        if (this.store.url != url) {
            this.store.url = url;
            this.store.load();
        }
    },
    listeners : {
        celldblclick: function(grid, rowIndex, columnIndex) {
            var store = this.getStore();
            var record = store.getAt(rowIndex);
            var field = store.fields.items[columnIndex];
            if (columnIndex == 0) {
                var time = record.data.time;
                if (store.filterTime) {
                    var min;
                    var max;
                    if (time < store.filterTime) {
                        min = time;
                        max = store.filterTime;
                    } else {
                        min = store.filterTime;
                        max = time;
                    }
                    store.addFilter("time", function(value) {
                        return value >= min && value <= max;
                    });
                    store.filterTime = null;
                } else {
                    store.filterTime = time;
                }
            } else if (columnIndex == 4) {
                store.toggleFilter("priority", function(value) {
                    return value >= record.data.priority;
                });
            } else if (columnIndex == 4) {
                if (window.clipboardData && window.clipboardData.setData) {
                    window.clipboardData.setData('text', record.data[field.name]);
                }
                return;
            } else {
                store.toggleFilter(field.name, record.data[field.name], false, true);
            }
            grid.getView().focusRow(store.indexOf(record));
        },
        headerclick: function(grid, columnIndex) {
            var store = this.getStore();
            var field = store.fields.items[columnIndex];
            store.clearFilter(columnIndex == 4 ? "priority" : field.name);
        }
    }
});

var logPanel = new LogPanel({
    id: 'log-panel'
});
