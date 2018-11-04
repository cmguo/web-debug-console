// panels/log.js

var FilterStore = function(c) {
    c.reader = new Ext.data.ArrayReader({id: 0}, ['id', c.filterField]);
    FilterStore.superclass.constructor.call(this, c);
    this.init();
};

Ext.extend(FilterStore, Ext.data.Store, {
    init: function() {
        var filter = function(store, records) {
            var field = this.filterField;
            var datas = [];
            var old = {};
            this.each(function(r) {
                old[r.id] = r;
            });
            records.forEach(function(r) {
                var v = r.get(field);
                if (v && !old[v]) {
                    datas.push([v, String(v)]);
                    old[v] = r;
                }
            });
            this.loadData(datas, true);
        };
        this.store.on("load", filter, this);
    }
});

//Ext.grid.filter.StringFilter.prototype.icon = 'img/find.png';

/********** 解决日历控件显示异常 **********/  
Ext.override(Ext.menu.DateMenu, {  
    render : function() {  
        Ext.menu.DateMenu.superclass.render.call(this);  
        if (Ext.isGecko || Ext.isSafari || Ext.isChrome) {  
            this.picker.el.dom.childNodes[0].style.width = '178px';  
            this.picker.el.dom.style.width = '178px';  
        }  
    }  
}); 


var Date_clearTime = Date.prototype.clearTime;

Ext.override(Date, {
    clearTime: function(clone) {
        if (isNaN(this.getTime()))
            return this;
        return Date_clearTime.call(this, clone);
    }
});


var ListFilter = function(c) {
    c.store = new FilterStore({
        store: c.store, 
        filterField: c.dataIndex
    });
    c.labelField = c.dataIndex;
    ListFilter.superclass.constructor.call(this, c);
}

Ext.extend(ListFilter, Ext.grid.filter.ListFilter, {
    toggleItem: function(id) {
        var sel;
        this.menu.items.each(function(item) {
            if (item.itemId == id) {
                sel = item;
            }
        });
        if (sel) {
            sel.setChecked(!sel.checked);
        }
    } 
});

Ext.override(Ext.grid.filter.Filter, {
    toggleActive: function() {
        if (this.isActivatable())
            this.setActive(!this.active);
    }
});

Ext.grid.filter.List2Filter = ListFilter;

var LogPanel = function(c) {
    var logStore = c.store || new StreamLogStore();
    var colMod = new Ext.grid.ColumnModel({
        defaultSortable: false, 
        columns: [{
            dataIndex: 'time', 
            xtype: 'date', 
            header : '时间', 
            renderer: Ext.util.Format.dateRenderer('m-d H:i:s.u'),
            width: 140
        }, {
            dataIndex: 'pid', 
            header : '进程', 
            width: 60
        }, {
            dataIndex: 'tid', 
            header : '线程', 
            width: 60
        }, {
            dataIndex: 'priority', 
            header : '等级', 
            width: 40
        }, {
            dataIndex: 'tag', 
            header : '模块', 
            width: 160
        }, {
            dataIndex: 'msg', 
            header: '消息', 
            width: 600
        }]
    });
    var filters = new Ext.grid.GridFilters({
        local: true, 
        filters: [{
            dataIndex: 'time', 
            type: 'date'
        }, {
            dataIndex: 'pid', 
            type: 'list2', 
            store: logStore
        }, {
            dataIndex: 'tid', 
            type: 'list2', 
            store: logStore
        }, {
            dataIndex: 'priority', 
            type: 'numeric'
        }, {
            dataIndex: 'tag', 
            type: 'list2', 
            store: logStore
        }, {
            dataIndex: 'msg', 
            type: 'string'
        }, {
            dataIndex: 'line', 
            type: 'string'
        }]
    });
    c = Ext.applyIf(c || {}, {
        store: logStore, 
        cm: colMod, 
        plugins: filters,
        tbar: [
            '搜索消息: ', ' ',
            new Ext.app.SearchField({
                store: new Ext.data.Store({
                    reload: function() {
                        var filter = filters.getFilter("line");
                        filter.setValue(this.baseParams['line']);
                        filter.setActive(filter.isActivatable());
                    }
                }),
                width: 320, 
                height: 300, 
                paramName: "line"
            }), {
                xtype: "button", 
                text: "清空", 
                handler: function() {
                    logStore.removeAll();
                }
            }, {
                xtype: "button", 
                text: "更多", 
                handler: function() {
                    logStore.loadNext();
                }
            }, {
                xtype: "button", 
                text: "复制", 
                handler: function() {
                    new ClipboardJS('#' + this.id, {
                        text: function(trigger) {
                            var lines = [];
                            logStore.each(function(record) {
                                lines.push(record.data.line);
                            });
                            return lines.join("\n");
                        }
                    });
                }
            }
        ]
    });
    LogPanel.superclass.constructor.call(this, c);
}

Ext.extend(LogPanel, Ext.grid.GridPanel, {
    title: '日志', 
    region: 'center',
    bodyBorder: false,
    autoWidth: true, 
    enableColumnHide: false, 
    enableColumnMove: false, 
    viewConfig: {
        getRowClass: function(record, index) {
            return 'log-' + record.data.priority;
        }
    },
    set_url: function(url) {
        url = url + "log?w=&f=json";
        if (this.store.url != url) {
            this.store.url = url;
            this.store.load({});
        }
    },
    listeners : {
        celldblclick: function(grid, rowIndex, columnIndex) {
            var store = this.getStore();
            var record = store.getAt(rowIndex);
            var field = store.fields.items[columnIndex];
            var filter = this.plugins.getFilter(columnIndex);
            var value = record.get(field.name);
            if (columnIndex == 0) {
                var time = value.getTime();
                if (store.filterTime) {
                    var min;
                    var max;
                    if (time < store.filterTime) {
                        min = time;
                        max = store.filterTime;
                    } else {
                        min = store.filterTime;
                        max = time;
                    }
                    filter.setValue({
                        after: new Date(min), 
                        before: new Date(max)
                    });
                    store.filterTime = null;
                } else {
                    store.filterTime = time;
                }
            } else if (columnIndex == 3) {
                filter.setValue({gt: value - 1});
            } else if (columnIndex == 5) {
                if (window.clipboardData && window.clipboardData.setData) {
                    window.clipboardData.setData('text', record.data[field.name]);
                }
                return;
            } else {
                filter.toggleItem(value);
            }
            grid.getView().focusRow(store.indexOf(record));
        },
        headerclick: function(grid, columnIndex) {
            var store = this.getStore();
            var field = store.fields.items[columnIndex];
            var filter = this.plugins.getFilter(columnIndex);
            filter.toggleActive();
        }
    }
});

var logPanel = new LogPanel({
    id: 'log-panel'
});
