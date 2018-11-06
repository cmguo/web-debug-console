// data/log/LogReader.js

var LogRecord = Ext.data.Record.create([
    'time', 
    'pid', 
    'tid', 
    'prio', 
    'tag', 
    'msg', 
    'line'
]);

var LogReader = function(c) {
    c = Ext.apply(c, {
        fields: c.fields || LogRecord
    });
    this.parser = c.parser || new LogWorkParser(c);
    LogReader.superclass.constructor.call(this, c, c.fields);
};

Ext.extend(LogReader, Ext.data.DataReader, {
    read: function(data, response) {
        var recordType = this.recordType;
        var callback = function(state) {
            if (state.msg) {
                LoadingWindow.setProcess(state);
            } else if (state.err) {
                if (state.count == 1)
                    Ext.MessageBox.alert("错误", state.line + "\n" + state.err);
            } else if (state.result) {
                items = state.result.map(function (result) {
                    convert_record(recordType, result);
                    return new Ext.data.Record(result);
                });
                LoadingWindow.setProcess(null);
                response({
                    count: items.length, 
                    records: items
                });
            }
        };
        this.parser.parseAll(data, callback);
    }
});
