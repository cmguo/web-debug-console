// data/DataProxy.js

var DataProxy = function(c) {
    Ext.apply(this, c.datasrc);
    this.addEvents({});
    DataProxy.superclass.constructor.call(this, c);
}

Ext.extend(DataProxy, Ext.util.Observable, {
    nextsrc: function() {
        Ext.apply(this, this.next);
    }
});

var FileProxy = function(c) {
    FileProxy.superclass.constructor.call(this, c);
}

Ext.extend(FileProxy, DataProxy, {
    loadData: function(response) {
        var reader = new FileReader();
        reader.onload = function(e) {
            response(e.target.result);
        };
        reader.readAsText(this.file)
    }
});

var EntryProxy = function(c) {
    EntryProxy.superclass.constructor.call(this, c);
}

Ext.extend(EntryProxy, DataProxy, {
    loadData: function(callback) {
        this.entry.getText(callback);
    }
});

var HttpProxy = function(c) {
    HttpProxy.superclass.constructor.call(this, c);
}

Ext.extend(HttpProxy, DataProxy, {
    loadData: function(callback) {
        Ext.Ajax.request(Ext.apply({
            url: this.url, 
            success: function(response) {
                callback(response.responseText);
            }
        }, this.opts));
    }
});
