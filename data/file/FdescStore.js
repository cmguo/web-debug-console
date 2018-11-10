// data/log/FdescStore.js

var FdescStore = function(c) {
    FdescStore.superclass.constructor.call(this, Ext.apply({
        sortInfo: { field: 'num' }, 
        reader: c.reader || new FdescReader(c)
    }, c));
}

Ext.extend(FdescStore, DataStore, {
});
