// data/DataStore.js

var DataStore = function(c) {
    DataStore.superclass.constructor.call(this, Ext.apply({
        reader: c.reader || this.createReader(c),
        proxy: DataStore.createProxy(c)
    }, c));
}

DataStore.createProxy = function(c) {
    if (c.proxy) {
        return c.proxy;
    } else if (!c.datasrc) {
        return null;
    } else if (c.datasrc.file) {
        return new FileProxy(c);
    } else if (c.datasrc.entry) {
        return new EntryProxy(c);
    } else if (c.datasrc.url) {
        return new HttpProxy(c);
    } else {
        return null;
    }
}

Ext.extend(DataStore, Ext.data.GroupingStore, {
    load: function(options) {
        if (this.loaded)
            return;
        if (this.fireEvent("beforeload", this, options) === false) {
            return false;
        }
        this.proxy.loadData(function(response) {
            this.loadData(response, options);
        }.bind(this));
    }, 
    loadData: function(data, options) {
        var records = this.reader.read(data);
        records = records.records;
        this.add(records);
        this.loaded = true;
        this.fireEvent("load", this, records, options);
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
        this.proxy.nextsrc();
        this.loaded = false;
        this.load({});
    }, 
});
