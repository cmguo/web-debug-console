// data/log/MmapStore.js

var MmapStore = function(c) {
    var proxy = c.proxy;
    if (c.datasrc && !proxy) {
        if (c.datasrc.file)
            proxy = new FileProxy(c);
        else if (c.datasrc.entry)
            proxy = new EntryProxy(c);
        else
            proxy = new HttpProxy(c);
    }
    MmapStore.superclass.constructor.call(this, Ext.apply({
        sortInfo: { field: 'addr' }, 
        reader: c.reader || new MmapReader(c),
        proxy: proxy
    }, c));
}

Ext.extend(MmapStore, Ext.data.GroupingStore, {
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
