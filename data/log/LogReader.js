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
    this.parser = c.parser || new LogParser(c);
    LogReader.superclass.constructor.call(this, c, c.fields);
};

Ext.extend(LogReader, Ext.data.DataReader, {
    read: function(data) {
        var lines = data.split(/\r?\n/);
        var items = [];
        for (var i = 0; i < lines.length; ++i) {
            var line = lines[i];
            if (line == "") continue;
            try {
                var result = this.parser.parse(line);
                items = items.concat(result);
            } catch (err) {
                Ext.MessageBox.alert("错误", line + "\n" + err);
            }
        }
        var recordType = this.recordType;
        items = items.map(function (result) {
            convert_record(recordType, result);
            return new Ext.data.Record(result);
        });
        return {count: items.length, records: items};
    }, 
});
