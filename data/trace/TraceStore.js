// data/log/TraceStore.js

var TraceStore = function(c) {
    c = Ext.applyIf(c || {}, {
        groupField: 'proc',
        reader: c.reader || new TraceReader(c)
    });
    if (c.datasrc && !c.proxy) {
        if (c.datasrc.file)
            c.proxy = new FileProxy(c);
        else if (c.datasrc.entry)
            c.proxy = new EntryProxy(c);
        else
            c.proxy = new HttpProxy(c);
    }
    TraceStore.superclass.constructor.call(this, c);
}

Ext.extend(TraceStore, Ext.data.GroupingStore, {
    load: function(options) {
        if (this.loaded)
            return;
        if (this.fireEvent("beforeload", this, options) === false) {
            return false;
        }
        this.proxy.loadData(function(response) {
            var records = this.reader.read(response);
            records = records.records;
            this.add(records);
            this.loaded = true;
            this.fireEvent("load", this, records, options);
        }.bind(this));
    }, 
    reload: function(options) {
        this.removeAll();
        this.loaded = false;
        this.load(options);
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
