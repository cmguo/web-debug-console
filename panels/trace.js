// panels/trace.js

var TracePanel = function(c) {
    var store = c.store || new TraceStore(c);
    var view = new Ext.grid.GroupingView(Ext.applyIf(c.viewConfig || {}, {
        forceFit: true,
        startCollapsed: true,
        enableGroupingMenu: false,
        groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})', 
        doGroupStart: function(buf, g, cs, ds, colCount) {
            if (g.gvalue.heldBy) {
                var h = g.gvalue.heldBy;
                g.style += h.heldBy == h ? " background-color: yellow" : " background-color: red";
            }
            Ext.grid.GroupingView.prototype.doGroupStart.apply(this, arguments);
        }
    }));
    var expander = new Ext.grid.RowExpander({
        tpl : new Ext.XTemplate(
                  '<tpl for="lines"',
                  '<p>{.}</p>',
                  '</tpl>'),
        getRowClass: function(record) {
            var cls = Ext.grid.RowExpander.prototype.getRowClass.apply(this, arguments );
            if (record.data.heldBy)
                cls += record.data.heldBy == record.data ? " log-5" : " log-6";
            return cls;
        }
    });
    var colMod = new Ext.grid.ColumnModel({
        defaultSortable: false, 
        columns: [expander, {
            dataIndex: 'proc', 
            header : '进程', 
            width: 30,
            renderer: function(proc) {
                return proc.pid;
            },
            groupRenderer: function(proc) {
                return proc.pid + " " + proc.cmdline;
            }
        }, {
            dataIndex: 'tid', 
            header : '线程', 
            width: 30
        }, {
            dataIndex: 'sysTid', 
            header : 'Tid', 
            width: 30
        }, {
            dataIndex: 'name', 
            header : '名称', 
            width: 100
        }, {
            dataIndex: 'state', 
            header : '状态', 
            width: 30
        }, {
            dataIndex: 'top', 
            header: '栈顶', 
            width: 300
        }, {
            dataIndex: 'wait', 
            header: '等待', 
            width: 200
        }]
    });
    var tbar = [
        '搜索: ', ' ',
        new Ext.app.SearchField({
            store: new Ext.data.Store({
                reload: function() {
                    var search = this.baseParams['lines'].toLowerCase();
                    if (search) {
                        store.filterBy(function(record) {
                            var lines = record.data.lines.filter(function(line) {
                                return line.toLowerCase().indexOf(search) > -1;
                            });
                            return lines.length > 0;
                        });
                    } else {
                        store.clearFilter();
                    }
                }
            }),
            width: 320, 
            height: 300, 
            paramName: "lines"
        })
    ];
    c = Ext.applyIf(c || {}, {
        region: 'center',
        bodyBorder: false,
        autoWidth: true, 
        enableColumnHide: false, 
        enableColumnMove: false, 
        store: store, 
        view: view, 
        cm: colMod, 
        trackMouseOver: false,
        plugins: expander, 
        tbar: tbar, 
        sm: new Ext.grid.RowSelectionModel({
            listeners: {
                beforerowselect: function() {
                    return false;
                }
            }
        })
    });
    TracePanel.superclass.constructor.call(this, c);
}

Ext.extend(TracePanel, Ext.grid.GridPanel, {
});

var jtracePanel = new TracePanel({
    id: 'jtrace-panel',
    title: '栈(J)', 
    viewConfig: {
        startCollapsed: false,
    },
    datasrc: {
        url: 'http://localhost/trace?o='
    },
    set_url: function(url) {
        url = url + "trace?o=";
        if (this.store.proxy.url != url) {
            this.store.proxy.url = url;
            this.store.reload({});
        }
    }
});

var ntracePanel = new TracePanel({
    id: 'ntrace-panel',
    title: '栈(N)', 
    viewConfig: {
        startCollapsed: false,
    },
    datasrc: {
        url: 'http://localhost/nativetrace?o='
    },
    set_url: function(url) {
        url = url + "nativetrace?o=";
        if (this.store.proxy.url != url) {
            this.store.proxy.url = url;
            this.store.reload({});
        }
    }
});
