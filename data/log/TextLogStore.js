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
        this.proxy.loadData(function(response) {
            var records = this.reader.read(response);
            records = records.records;
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
});
