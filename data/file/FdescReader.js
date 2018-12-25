// data/file/FdescReader.js

var FdescRecord = Ext.data.Record.create([
    'name', 
    'size',
    'date', 
    'time',
    'timestamp',
    'mode',
    'symlink', 
    'num', 
    'type', 
]);

var FdescReader = function(c) {
    c = Ext.apply(c, {
        fields: c.fields || FdescRecord
    });
    FdescReader.superclass.constructor.call(this, c, c.fields);
};

Ext.extend(FdescReader, FlstReader, {
    readRecord: function(line) {
        var file = FdescReader.superclass.readRecord.call(this, line);
        file.num = parseInt(file.name);
        if (file.symlink) {
            var n = file.symlink.indexOf(':');
            if (n > 0) {
                file.type = file.symlink.substring(0, n);
            } else {
                file.type = "file";
            }
        } else {
            file.symlink = "";
            file.type = "";
        }
        return file;
    }
});
