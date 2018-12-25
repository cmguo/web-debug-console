// panel/file.js

var FileTree = function(c) {
    FileTree.superclass.constructor.call(this, Ext.apply({
        loader: new StatusLoader(Ext.apply({
            uiProviders: {
                'col': Ext.tree.ColumnNodeUI
            },
            createNode: function(attr) {
                //attr.iconCls = attr.type;
                // #00: lrwxrwxrwx         20 1970-01-01 08:00:00.000 Customer
                var line = attr.text;
                if (line.charAt(0) != '#') return null;
                var pos = line.indexOf(": ") + 2;
                line = line.substring(pos).replace("&gt", ">");
                var file = FlstReader.prototype.readRecord(line);
                Ext.apply(attr, file);
                attr.text = file.name;
                attr.uiProvider = "col";
                return StatusLoader.prototype.createNode.call(this, attr);
            }
        }, c)),
        root: new Ext.tree.AsyncTreeNode({
            text: '/',
            id: 'debug/file'
        })
    }, c));
};

Ext.extend(FileTree, Ext.tree.ColumnTree, {
    width: 540,
    rootVisible: false,
    autoScroll: true,
    columns:[{
        header:'名称',
        width:240,
        dataIndex:'name'
    },{
        header:'大小',
        width:60,
        dataIndex:'size', 
        cls: "file-size",
        renderer: humanFileSize,
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
    }], 
    listeners: {
        contextmenu: function(node, e) {
            var c = node.getOwnerTree().contextMenu;
            c.contextNode = node;
            c.showAt(e.getXY());
        }
    },
    contextMenu: new Ext.menu.Menu({
        items: [{
            id: 'refresh',
            text: '刷新'
        }, {
            id: 'get', 
            scope: this, 
            text: '另存为'
        }, {
            id: 'remove', 
            text: '删除'
        }],
        listeners: {
            itemclick: function(item) {
                var n = item.parentMenu.contextNode;
                switch (item.id) {
                    case 'refresh':
                        n.reload();
                        break;
                }
            }
        }, 
    })
});

var FilePanel = function(c) {
    FilePanel.superclass.constructor.call(this, Ext.apply({
        items: [
            new FileTree(Ext.apply({
                region: 'west'
            }, c)), {
                xtype: 'textarea',
                itemId: 'file-output',
                region: 'center',
                border: true,
                emptyText: '预览'
            }
        ]
    }, c));
};

Ext.extend(FilePanel, Ext.Panel, {
    title: '存储',
    layout: 'border',
    iconCls: "file-tab"
});

