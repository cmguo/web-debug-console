// data/log/StoneStore.js

var StoneStore = function(c) {
    StoneStore.superclass.constructor.call(this, Ext.apply({
        reader: c.reader || new StoneReader(c)
    }, c));
}

Ext.extend(StoneStore, DataStore, {
});
