2// gird/filter/List2Filter.js

var FilterStore = function(c) {
    var fields = ['id', c.dataIndex]
    if (c.groupField) {
        fields.push(c.groupField);
    }
    FilterStore.superclass.constructor.call(this, Ext.apply({
        reader: new Ext.data.ArrayReader({id: 0}, ['id', c.dataIndex, c.groupField])
    }, c));
    this.init();
};

Ext.extend(FilterStore, Ext.data.GroupingStore, {
    init: function() {
        var filter = function(store, records) {
            var field = this.dataIndex;
            var groupField = this.groupField;
            var groupFormattor = this.groupFormattor || function(v, r) {
                return r.get(groupField);
            }
            var datas = [];
            var old = {};
            this.each(function(r) {
                old[r.id] = r;
            });
            records.forEach(function(r) {
                var v = r.get(field);
                if (v && !old[v]) {
                    datas.push([v, String(v), 
                        groupField ? groupFormattor(v, r) : null]);
                    old[v] = r;
                }
            });
            var r = this.reader.readRecords(datas);
            this.add(r.records);
            if (this.groupField) {
                this.sortData(this.groupField);
            }
            this.fireEvent("load", this, this.data.items);
        };
        this.store.on("load", filter, this);
        this.store.on("add", filter, this);
    }
});


Ext.grid.filter.List2Filter = function(c) {
    c.store = new FilterStore(c);
    c.labelField = c.labelField || c.dataIndex;
    Ext.grid.filter.List2Filter.superclass.constructor.call(this, c);
}

Ext.extend(Ext.grid.filter.List2Filter, Ext.grid.filter.ListFilter, {
    toggleItem: function(id) {
        var sel;
        this.visitItem(function(item) {
            if (item.itemId == id) {
                sel = item;
            }
            return true;
        });
        if (sel) {
            sel.setChecked(!sel.checked);
        }
    } 
});
