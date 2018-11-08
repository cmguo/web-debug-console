// data/log/StreamLogStore.js

var StreamLogStore = function(c) {
    var parser = c.parser || new LogParser(c);
    StreamLogStore.superclass.constructor.call(this, Ext.apply({
        minLines: 1, 
        minScore: 1, 
        url: c.datasrc.url + "log?w=&f=json",
        parser: parser
    }, c));
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
            reader: this.reader,
            position: 0,
            parse: function(response) {
                var end = response.lastIndexOf('}\n');
                if (end > this.position) {
                    var lines = response.substring(this.position, end + 1);
                    try {
                        this.reader.read(lines, function(result) {
                            this.store.add(result.records);
                        }.bind(this));
                    //} catch (err) {
                    //    Ext.MessageBox.alert("错误", err);
                    } finally {
                        this.position = end + 2;
                    }
                }
            }
        };
        this.removeAll();
        this.add(new this.recordType({
            line: '0 0 0 D --- http://',
            time: new Date(),
            pid: 0, 
            tid: 0, 
            prio: 7,
            tag: '---',
            msg: this.url
        }));
        var thiz = this;
        oReq.onreadystatechange = function() {
            if (this.readyState > 2) {
                state.parse(this.responseText);
                if (this.readyState == 4) {
                    thiz.add(new thiz.recordType({
                        line: '0 0 0 D --- http://',
                        time: new Date(),
                        pid: 0, 
                        tid: 0, 
                        prio: 7,
                        tag: '---',
                        msg: "数据链接已经断开"
                    }));
                }
            }
        }
        if (this.oReq)
            this.oReq.abort();
        this.oReq = oReq;
        oReq.open("get", this.url, true);
        oReq.send();
        return true;
    },
    add : function(records){
        records = [].concat(records);
        for(var i = 0, len = records.length; i < len; i++){
            records[i].join(this);
        }
        var index = this.data.length;
        if (this.snapshot) {
            this.snapshot.addAll(records);
        }
        var records2 = records;
        if (this.filterFn) {
            records2 = records.filter(this.filterFn);
        }
        if (records2.length < 1) {
            return;
        }
        this.data.addAll(records2);
        this.fireEvent("add", this, records, index);
    },
    filterBy: function(fn, scope) {
        this.filterFn = fn.bind(scope || this);
        StreamLogStore.superclass.filterBy.call(this, fn, scope);
    },
    clearFilter: function() {
        this.filterFn = null;
        StreamLogStore.superclass.clearFilter.call(this);
    }
});
