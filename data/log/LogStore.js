// data/log/LogStore.js

var LogStore = function(c) {
    c = Ext.applyIf(c || {}, {
        reader: c.reader || new LogReader(c)
    });
    LogStore.superclass.constructor.call(this, c);
};

Ext.extend(LogStore, Ext.data.Store, {
});
