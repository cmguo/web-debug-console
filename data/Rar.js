// data/Rar.js

var rpc = { loaded: function() {} };
RPC.new("libunrar/worker.js", rpc).then(function(r) {
    rpc = r;
});

var Rar = function(c) {
};

Ext.extend(Rar, Object, {
    open: function(src, callback) {
        var getText = function(callback) {
            var text = new TextDecoder("utf-8").decode(this.fileContent);
            callback(text);
        };
        var getDataUrl = function(callback) {
            callback(URL.createObjectURL(new Blob([this.fileContent])));
        };
        var entries = [];
        var rec = function(entry) {
            if(entry.type === 'file') {
                entry.getText = getText;
                entry.getDataUrl = getDataUrl;
                var type = panels.getType(entry.fullFileName);
                entries.push({
                    text: entry.fullFileName, 
                    name: entry.fullFileName, 
                    type: type, 
                    entry: entry
                });
            } else if(entry.type === 'dir') {
                Object.keys(entry.ls).forEach(function(k) {
                    rec(entry.ls[k])
                })
            } else {
                throw "Unknown type"
            }
        };
        var reader;
        if (src.file)
            reader = new zip.BlobReader(src.file);
        else
            reader = new zip.HttpReader(src.url);
        reader.init(function() {
            reader.readUint8Array(0, reader.size, function(bytes) {
                var data = [{name: src.text, content: bytes}];
                rpc.unrar(data, null).then(function(ret) {
                    rec(ret);
                    callback(this, entries);
                }.bind(this));
            });
        });
    }
});
