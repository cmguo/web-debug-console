// data/log/TextLogStore.js

var TextLogStore = Ext.extend(LogStore, {
    load: function(options) {
        if (this.loaded)
            return;
        if (this.fireEvent("beforeload", this, options) === false) {
            return false;
        }
        var state = {
            msg: "读取日志...",
            total: 1, 
            finish: 0
        };
        LoadingWindow.setProcess(state);
        this.proxy.loadData(function(response) {
            this.reader.read(response, function(records) {
                records = records.records;
                this.clearFilter(true);
                for(var i = 0, len = records.length; i < len; i++){
                    this.data.insert(i, records[i]);
                    records[i].join(this);
                }
                this.loaded = true;
                this.fireEvent("load", this, records, options);
            }.bind(this));
        }.bind(this));
    }, 
});
