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

Ext.extend(LogReader, DataReader, {
    read: function(data, response) {
        if (!response) {
            return this.readRecords(this.parser.parseAll(data));
        }
        var callback = function(state) {
            if (state.msg) {
                LoadingWindow.setProcess(state);
            } else if (state.err) {
                if (state.count == 1)
                    Ext.MessageBox.alert("错误", state.line + "\n" + state.err);
            } else if (state.result) {
                var records = this.readRecords(state.result);
                LoadingWindow.setProcess(null);
                response(records);
            }
        }.bind(this);
        this.parser.parseAll(data, callback);
    }
});
