// panels/Fdesc.js

var FdescPanel = function(c) {
    var store = c.store || new FdescStore(Ext.applyIf({
        datasrc: Ext.applyIf({
            url: c.datasrc.url + "file.list?l=&_=/proc/self/fd"
        }, c.datasrc)
    }, c));
    var view = new Ext.grid.GroupingView(Ext.apply({
        forceFit: true,
        startCollapsed: true,
        groupTextTpl: '{text} ({[values.rs.length]} {[values.rs.length > 1 ? "Items" : "Item"]})', 
        getRowClass: function(record, index) {
            return 'log-' + (record.data.modify + 4);
        }, 
    }, c.viewConfig));
    var colMod = new Ext.grid.ColumnModel({
        defaultSortable: true, 
        columns:[{
            header:'名称',
            width:40,
            dataIndex:'num'
        },{
            header:'日期',
            width:80,
            dataIndex:'date'
        },{
            header:'时间',
            width:60,
            dataIndex:'time'
        },{
            header:'模式',
            width:70,
            dataIndex:'mode'
        },{
            header:'类型',
            width:60,
            dataIndex:'type'
        },{
            header:'信息',
            width:340,
            dataIndex:'symlink'
        }]
    });
    var tbar = [
        '搜索: ', ' ',
        new Ext.app.SearchField({
            store: new Ext.data.Store({
                reload: function() {
                    var search = this.baseParams['line'].toLowerCase();
                    if (search) {
                        store.filterBy(function(record) {
                            return record.data.line.toLowerCase().indexOf(search) > -1;
                        });
                    } else {
                        store.clearFilter();
                    }
                }
            }),
            width: 320, 
            height: 300, 
            paramName: "line"
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
    if (c.datasrc) {
        tbar.push({
            xtype: "button", 
            text: "刷新", 
            handler: function() {
                store.reload();
            }
        });
    }
    FdescPanel.superclass.constructor.call(this, Ext.apply({
        region: 'center',
        bodyBorder: false,
        autoWidth: true, 
        enableColumnHide: false, 
        enableColumnMove: false, 
        store: store, 
        view: view,
        cm: colMod, 
        trackMouseOver: false,
        tbar: tbar
    }, c));
}

Ext.extend(FdescPanel, Ext.grid.GridPanel, {
    title: '描述符', 
    listeners: {
        activate: function() {
            this.store.load({});
        }
    }
});
