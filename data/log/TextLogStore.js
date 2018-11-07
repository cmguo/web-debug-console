// data/log/TextLogStore.js

var TextLogStore = function(c) {
    c == c || {};
    if (c.datasrc && !c.proxy) {
        if (c.datasrc.file)
            c.proxy = new FileProxy(c);
        else if (c.datasrc.entry)
            c.proxy = new EntryProxy(c);
        else
            c.proxy = new HttpProxy(c);
    }
    TextLogStore.superclass.constructor.call(this, c);
}

Ext.extend(TextLogStore, LogStore, {
    load: function(options) {
        if (this.loaded)
            return;
        if (this.fireEvent("beforeload", this, options) === false) {
            return false;
        }
        var state = {
            msg: "读取日志...",
            total: 1, 
            finish: 0
        };
        LoadingWindow.setProcess(state);
        this.proxy.loadData(function(response) {
            this.reader.read(response, function(records) {
                records = records.records;
                this.clearFilter(true);
                for(var i = 0, len = records.length; i < len; i++){
                    this.data.insert(i, records[i]);
                    records[i].join(this);
                }
                this.loaded = true;
                this.fireEvent("load", this, records, options);
            }.bind(this));
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
});
