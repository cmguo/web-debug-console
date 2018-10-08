// log.js

var StreamJsonStore = function(c) {
    StreamJsonStore.superclass.constructor.call(this, c);
};

Ext.extend(StreamJsonStore, Ext.data.JsonStore, {
    load: function(options){
        options = options || {};
        if(this.fireEvent("beforeload", this, options) !== false){
            this.storeOptions(options);
            var p = Ext.apply(options.params || {}, this.baseParams);
            var oReq = new XMLHttpRequest();
            var state = {
                store: this, 
                position: 0,
                parse: function(response) {
                    var end = response.indexOf('}\n', this.position);
                    while (end > 0) {
                        var line = response.substring(this.position, end + 1);
                        line = line.replace(new RegExp("\n", 'g'), "\\n");
                        var result = Ext.decode(line);
                        this.store.put(result);
                        this.position = end + 2;
                        end = response.indexOf('}\n', this.position);
                    }
                }
            };
            oReq.onreadystatechange = function() {
                if (this.readyState > 2) {
                    state.parse(this.responseText);
                }
            }
            oReq.open("get", this.url, true);
            oReq.send();
            return true;
        } else {
            return false;
        }
    }, 
    put: function(record) {
        convert_record(this.recordType, record);
        record = new Ext.data.Record(record);
        if (this.filterFn && !this.filterFn(record)) {
            if(this.snapshot){
                record.join(this);
                this.snapshot.add(record);
            }
            return;
        }
        this.add(record);
    },
    addFilter: function(property, value, anyMatch, caseSensitive){
        this.filters = this.filters || {};
        value = String(value);
        this.filters[property] = new RegExp((anyMatch === true ? '' : '^') 
            + Ext.escapeRe(value) + (anyMatch === true ? '' : '$'), 
            caseSensitive ? '' : 'i');
        this.updateFilter();
    },
    clearFilter: function(property) {
        delete this.filters[property];
        this.updateFilter();
    },
    toggleFilter: function(property, value, anyMatch, caseSensitive) {
        if (this.filters && this.filters[property])
            this.clearFilter(property);
        else
            this.addFilter(property, value, anyMatch, caseSensitive);
    },
    updateFilter: function(){
        var filters = this.filters;
        this.filterFn = function(r) {
            for (var f in filters) {
                if (!filters[f].test(r.data[f])) {
                    return false;
                }
            }
            return true;
        }
        this.filterBy(this.filterFn);
    }
});

var log_store = new StreamJsonStore({
    fields: [ {name: 'time', convert: function(v) { return new Date(v); } }, 'pid', 'tid', 'tag', 'msg'],
    url: 'http://10.200.74.16:8085/log?w=&f=json'
});

var panel_log = {
    id: 'log-panel', 
    title: '日志', 
    bodyBorder: false,
    autoWidth: true, 
    columns: [{
        id: 'time', 
        xtype: 'date', 
        header : '时间', 
        renderer: Ext.util.Format.dateRenderer('m-d h:i:s.u'),
        width: 160
    }, {
        id: 'pid', 
        header : '进程', 
        width: 60
    }, {
        id: 'tid', 
        header : '线程', 
        width: 60
    }, {
        id: 'tag', 
        header : '模块', 
        width: 160
    }, {
        id: 'msg', 
        header: '消息', 
        width: 600
    }], 
    store: log_store, 
    listeners : {
        celldblclick: function(grid, rowIndex, columnIndex) {
            var store = this.getStore();
            var record = store.getAt(rowIndex);
            var field = store.fields.items[columnIndex];
            store.toggleFilter(field.name, record.data[field.name], false, true);
            grid.getView().focusRow(store.indexOf(record));
        },
        headerclick: function(grid, columnIndex) {
            var store = this.getStore();
            var field = store.fields.items[columnIndex];
            store.clearFilter(field.name);
        }
    }
}

menu_def.add({
    id: 'log',
    text: panel_log.title,
    icon: panel_log.icon,
    leaf: true,
    panel: function() {
        log_store.load();
        return new Ext.grid.GridPanel(panel_log);
    }
});

