// data/log/FlstReader.js

var FlstRecord = Ext.data.Record.create([
    'name', 
    'size',
    'date', 
    'time',
    'timestamp',
    'mode',
    'symlink',
]);

var FlstReader = Ext.extend(DataReader, {
    fields: FlstRecord, 
    readRecord: function(line) {
        var file = {};
        var pos = 0;
        file.mode = line.substring(pos, pos + 10); pos += 11;
        file.size = parseInt(line.substring(pos, pos + 10).trim()); pos += 11;
        file.timestamp = new Date(line.substring(pos, pos + 23));
        file.date = line.substring(pos, pos + 10); pos += 11;
        file.time = line.substring(pos, pos + 8); pos += 13;
        file.name = line.substring(pos);
        var sl = file.name.indexOf(" -&gt ");
        if (sl > 0) {
            file.symlink = file.name.substring(sl + 6);
            file.name = file.name.substring(0, sl);
        }
        return file;
    }
});
