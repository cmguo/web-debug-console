// data/log/MmapStore.js

var MmapStore = function(c) {
    MmapStore.superclass.constructor.call(this, Ext.apply({
        sortInfo: { field: 'addr' }, 
        reader: c.reader || new MmapReader(c)
    }, c));
}

Ext.extend(MmapStore, DataStore, {
});
