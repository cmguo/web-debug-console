// data/file/FlstStore.js

var FlstStore = function(c) {
    FlstStore.superclass.constructor.call(this, Ext.apply({
        reader: c.reader || new FlstReader(c)
    }, c));
}

Ext.extend(FlstStore, DataStore, {
});
