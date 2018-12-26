// data/log/LogStore.js

var LogStore = Ext.extend(DataStore, {
    createReader: function(c) {
        return new LogReader(c);
    },
});
