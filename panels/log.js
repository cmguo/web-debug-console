// panels/log.js

var LogTagTree = function(c) {
    ConfigPanel.superclass.constructor.call(this, Ext.apply({
        root: {
            id: '#', 
            text: '',
            children: Object.keys(LogStore.tagFilterGroups).map(function(k) {
                return {
                    id: k,
                    text: '{' + k + '}',
                    children: this[k].map(function(v) {
                        return {
                            text: v, 
                            leaf: true
                        };
                    })
                };
            }, LogStore.tagFilterGroups)
        },
        buttons: [{
            text: '增加组', 
            scope: this, 
            handler: this.addGroup
        }, {
            text: '增加', 
            scope: this, 
            handler: this.addTag
        }, {
            text: '删除', 
            scope: this, 
            handler: this.delete
        }]
    }, c));
};

Ext.extend(LogTagTree, Ext.tree.TreePanel, {
    rootVisible: false,
    addGroup: function() {
        var root = this.getRootNode();
        InputWindow.input("输入TAG分组名称", function(k) {
            LogStore.addTagFilterGroup(k)
            var node = new Ext.tree.TreeNode({
                id: k,
                text: '{' + k + '}',
                children: []
            });
            root.appendChild(node);
        });
    },
    addTag: function() {
        var node = this.getSelectionModel().getSelectedNode();
        InputWindow.input("输入TAG", function(k) {
            if (!LogStore.addTagFilter(node.id, k)) return;
            node.appendChild(new Ext.tree.TreeNode({
                text: k, 
                leaf: true
            }));
        });
    },
    delete: function() {
        var node = this.getSelectionModel().getSelectedNode();
        if (node) {
            if (node.leaf) {
                LogStore.removeTagFilter(node.parentNode.id, node.text)
            } else {
                LogStore.removeTagFilterGroup(node.id);
            }
            node.remove();
        }
    }
});

var LogConfig = function(c) {
    var logTagTree = new LogTagTree({
        title: 'TAG过滤器分组'
    });
    LogConfig.superclass.constructor.call(this, Ext.apply({
        items: [
            logTagTree
        ]
    }, c));
};

Ext.extend(LogConfig, Ext.Panel, {
    title: '日志',
    layout: 'fit'
});

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

var alphaGroup = function(v) {
    var c = v.charAt(0).toUpperCase().charCodeAt(0);
    if (c >= 0x41 && c <= 0x5a) {
        c -= (c + 1) % 3;
        if (c < 0x59) {
            return '['+ String.fromCharCode(c) 
                + String.fromCharCode(c + 1) 
                + String.fromCharCode(c + 2) + ']';
        } else {
            return '['+ String.fromCharCode(c) 
                + String.fromCharCode(c + 1) + ']';
        }
    } else {
        return '[Other]';
    }
}

Ext.override(Date, {
    clearTime: function(clone) {
        if (isNaN(this.getTime()))
            return this;
        return Date_clearTime.call(this, clone);
    }
});

Ext.override(Ext.grid.filter.Filter, {
    toggleActive: function() {
        if (this.isActivatable())
            this.setActive(!this.active);
    }
});

var LogPanel = function(c) {
    var store = c.store || new TextLogStore(c);
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
            dataIndex: 'prio', 
            header : '等级', 
            width: 40,
            renderer: function(v) {
                return "  VDIWEF".charAt(v);
            }
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
    var page = new Ext.grid.filter.PageFilter(c);
    var filters = new Ext.grid.GridFilters({
        local: true, 
        filters: [page, {
            dataIndex: 'time', 
            type: 'date'
        }, {
            dataIndex: 'pid', 
            type: 'list2', 
            store: store
        }, {
            dataIndex: 'tid', 
            type: 'list2', 
            groupField: 'pid',
            store: store
        }, {
            dataIndex: 'prio', 
            type: 'numeric'
        }, {
            dataIndex: 'tag', 
            type: 'list2', 
            groupField: 'tag-alpha',
            groupFormattor: alphaGroup,
            groupCache: LogStore.tagFilterGroups,
            menuItems: [{
                text: '保存到分组',
                scope: this,
                handler: this.saveTagGroup
            }, '-'],
            store: store
        }, {
            dataIndex: 'msg', 
            type: 'string'
        }, {
            dataIndex: 'line', 
            type: 'string'
        }]
    });
    var tbar = [
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
            text: "复制", 
            id: "log-copy", 
            handler: function() {
                new ClipboardJS('#' + this.id, {
                    text: function(trigger) {
                        var lines = [];
                        store.each(function(record) {
                            lines.push(record.data.line);
                        });
                        return lines.join("\n");
                    }
                });
            }
        }
    ];
    if (store.datasrc.type == 'endpoint') {
        tbar.push({
            xtype: "button", 
            text: "清空", 
            handler: function() {
                store.removeAll();
            }
        });
        tbar.push({
            xtype: "button", 
            text: "重连", 
            handler: function() {
                store.reload();
            }
        });
    } else if (store.datasrc.next) {
        tbar.push({
            xtype: "button", 
            text: "更多", 
            handler: function() {
                store.loadNext();
            }
        });
    }
    LogPanel.superclass.constructor.call(this, Ext.apply({
        title: '日志', 
        store: store, 
        cm: colMod, 
        trackMouseOver: false,
        plugins: [ filters, page ],
        sm: new Ext.grid.RowSelectionModel(),
        tbar: tbar
    }, c));
}

Ext.extend(LogPanel, Ext.grid.GridPanel, {
    region: 'center',
    bodyBorder: false,
    autoWidth: true, 
    enableColumnHide: false, 
    enableColumnMove: false, 
    iconCls: "log-tab", 
    viewConfig: {
        getRowClass: function(record, index) {
            return 'log-' + record.data.prio;
        }, 
        listeners: {
            rowsinserted: function(view, first, last) {
                var vB = view.el.getBottom();
                var fT = Ext.fly(view.getRow(first)).getTop();
                if (vB >= fT) {
                    if (last >= view.ds.getCount())
                        last = view.ds.getCount() - 1;
                    var lB = Ext.fly(view.getRow(last)).getBottom();
                    if (lB > vB)
                        view.scroller.dom.scrollTop += lB - fT;
                }
            }
        }
    },
    saveTagGroup: function() {
        var filter = this.filters.getFilter('tag');
        var values = filter.getNonCachedValue();
        if (values.length == 0) return;
        InputWindow.input("输入TAG分组名称", function(k) {
            if (!LogStore.addTagFilterGroup(k, values)) return;
            filter.addCacheGroup(k, values);
        });
    },
    listeners : {
        celldblclick: function(grid, rowIndex, columnIndex) {
            var store = this.getStore();
            var record = store.getAt(rowIndex);
            var field = store.fields.items[columnIndex];
            var filter = this.filters.getFilter(field.name);
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
                    filter.setActive(true);
                    store.filterTime = null;
                } else {
                    store.filterTime = time;
                }
            } else if (columnIndex == 3) {
                filter.setValue({gt: value - 1});
                filter.setActive(true);
            } else if (columnIndex == 5) {
                new ClipboardJS('#log-copy', {
                    text: function(trigger) {
                        return record.get("line");
                    }
                });
                return;
            } else {
                filter.toggleItem(value);
            }
            grid.getView().focusRow(store.indexOf(record));
        },
        headerclick: function(grid, columnIndex) {
            var store = this.getStore();
            var field = store.fields.items[columnIndex];
            var filter = this.filters.getFilter(field.name);
            filter.toggleActive();
        }, 
        activate: function() {
            this.store.load({});
        }
    }
});
