// panels/Mmap.js

var MmapPanel = function(c) {
    if (c.path) {
        c.datasrc = Ext.apply({}, c.datasrc);
        c.datasrc.url += c.path;
        c.viewConfig = {
            startCollapsed: false,
        };
    }
    var store = c.store || new MmapStore(c);
    var view = new Ext.grid.GroupingView(Ext.apply({
        forceFit: true,
        startCollapsed: true,
        groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})', 
    }, c.viewConfig));
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
            dataIndex: 'addr', 
            header : '地址', 
            width: 140,
            sortable: true, 
        }, {
            dataIndex: 'size', 
            header : '大小', 
            width: 70, 
            sortable: true, 
            css: "text-align: right;",
            renderer: humanFileSize
        }, {
            dataIndex: 'modestr', 
            header : '模式', 
            width: 60, 
            sortable: true, 
        }, {
            dataIndex: 'device', 
            header : '设备号', 
            width: 60, 
            sortable: true, 
        }, {
            dataIndex: 'fileno', 
            header: '节点', 
            width: 60
        }, {
            dataIndex: 'offsetstr', 
            header: '偏移', 
            width: 70
        }, {
            dataIndex: 'filename', 
            header: '文件名', 
            width: 500
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
    if (c.path) {
        tbar.push({
            xtype: "button", 
            text: "刷新", 
            handler: function() {
                store.reload();
            }
        });
    }
    MmapPanel.superclass.constructor.call(this, Ext.apply({
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
        tbar: tbar
    }, c));
}

Ext.extend(MmapPanel, Ext.grid.GridPanel, {
    title: '内存', 
    listeners: {
        activate: function() {
            this.store.load({});
        }
    }
});
