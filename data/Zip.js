// data/Zip.js

var Zip = function(c) {
};

Ext.extend(Zip, Object, {
    open: function(src, callback) {
        var reader;
        if (src.file)
            reader = new zip.BlobReader(src.file);
        else
            reader = new zip.HttpReader(src.url);
        var getText = function(callback) {
            this.getData(new zip.TextWriter(), function(text) {
                callback(text);
            });
        }
        var getDataUrl = function(callback) {
            this.getData(new zip.BlobWriter(), function(blob) {
                callback(URL.createObjectURL(blob));
            });
        }
        var rec = function(entry) {
            entry.getText = getText;
            entry.getDataUrl = getDataUrl;
            var type = panels.getType(entry.filename);
            return {
                text: entry.filename, 
                name: entry.filename, 
                type: type, 
                entry: entry
            };
        };
        var resp = function(entries) {
            callback(this, entries.map(rec));
        }.bind(this);
        zip.createReader(reader, function(zipReader) {
            src.reader = zipReader;
            zipReader.getEntries(resp, function(msg) {
            });
        });
    }
});
