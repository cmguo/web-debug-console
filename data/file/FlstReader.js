// data/file/FlstReader.js

var FlstRecord = Ext.data.Record.create([
    'name', 
    'size',
    'date', 
    'time',
    'timestamp',
    'mode',
    'symlink',
]);

var FlstReader = function(c) {
    c = Ext.apply(c, {
        fields: c.fields || FlstRecord
    });
    FlstReader.superclass.constructor.call(this, c, c.fields);
};

Ext.extend(FlstReader, DataReader, {
    fields: FlstRecord, 
    readRecord: function(line) {
        var file = {};
        var pos = 0;
        file.line = line;
        file.mode = line.substring(pos, pos + 10); pos += 11;
        file.user = line.substring(pos, pos + 10).trim(); pos += 11;
        file.group = line.substring(pos, pos + 10).trim(); pos += 11;
        file.size = parseInt(line.substring(pos, pos + 10).trim()); pos += 11;
        file.timestamp = new Date(line.substring(pos, pos + 23));
        file.date = line.substring(pos, pos + 10); pos += 11;
        file.time = line.substring(pos, pos + 8); pos += 13;
        file.name = line.substring(pos);
        var sl = file.name.indexOf(" -> ");
        if (sl > 0) {
            file.symlink = file.name.substring(sl + 4);
            file.name = file.name.substring(0, sl);
        } else {
            file.name = file.name;
        }
        return file;
    }
});
