// data/log/MmapReader.js

var MmapRecord = Ext.data.Record.create([
    'addr', 
    'size',
    'modestr', 
    'offsetstr',
    'device',
    'fileno',
    'filename',
]);

var MmapReader = function(c) {
    c = Ext.apply(c, {
        fields: c.fields || MmapRecord
    });
    MmapReader.superclass.constructor.call(this, c, c.fields);
};

Ext.extend(MmapReader, Ext.data.DataReader, {
    read: function(data) {
        var lines = data.split('\n');
        var mmaps = [];
        var mmap = null;
        lines.forEach(function(line) {
            if (line == "")
                return;
            var c = line.charAt(0);
            if ((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f')) {
                m = {
                    line: line, 
                    lines: [line], 
                    sizes: {}, 
                    attrs: {}
                };
                mmaps.push(m);
                var tokens = line.split(/ +/, 6);
                m.line = line;
                m.addr = tokens[0];
                var addrs = tokens[0].split("-", 2);
                m.saddr = parseInt(addrs[0], 16);
                m.eaddr = parseInt(addrs[1], 16);
                m.size = m.eaddr - m.saddr;
                m.modestr = tokens[1];
                for (var i = 0; i < m.modestr.length; ++i) {
                    c = m.modestr.charAt(i);
                    if (c == '-' || c == 'p')
                        m.mode <<= 1;
                    else
                        m.mode = (m.mode << 1) | 1;
                }
                m.offsetstr = tokens[2];
                m.offset = parseInt(tokens[2], 16);
                m.device = tokens[3];
                var device = tokens[3].split(":", 2);
                m.major = parseInt(device[0], 16);
                m.minor = parseInt(device[1], 16);
                m.fileno = parseInt(tokens[4]);
                m.filename = tokens[5];
            } else {
                m.lines.push(line);
                var tokens = line.split(/: +/, 2);
                if (tokens[1].endsWith(" kB")) {
                    var size = parseInt(
                            tokens[1].substring(0, tokens[1].length - 3));
                    m.sizes[tokens[0]] = size;
                } else {
                    m.attrs[tokens[0]] = tokens[1];
                }
            }
        }, this);
        var recordType = this.recordType;
        mmaps = mmaps.map(function (result) {
            convert_record(recordType, result);
            return new Ext.data.Record(result);
        });
        return {count: mmaps.length, records: mmaps};
    }
});
