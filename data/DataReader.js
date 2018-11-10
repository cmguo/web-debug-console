// data/DataReader.js

var DataReader = Ext.extend(Ext.data.DataReader, {
    read: function(data) {
        var records = this.readData(data);
        return this.readRecords(records);
    }, 
    readData: function(data) {
        var lines = data.split('\n');
        var records = [];
        lines.forEach(function(line) {
            if (line == "") return;
            var record = this.readRecord(line);
            records.push(record);
        });
        return records;
    }, 
    readRecord: function(line) {
        return Ext.decode(line);
    },
    readRecords: function(records) {
        var recordType = this.recordType;
        records = records.map(function (result) {
            convert_record(recordType, result);
            return new Ext.data.Record(result);
        });
        return {count: records.length, records: records};
    }
});
