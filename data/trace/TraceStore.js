// data/log/TraceStore.js

var TraceStore = function(c) {
    TraceStore.superclass.constructor.call(this, Ext.apply({
        groupField: 'proc',
        reader: c.reader || new TraceReader(c)
    }, c));
}

Ext.extend(TraceStore, DataStore, {
});
