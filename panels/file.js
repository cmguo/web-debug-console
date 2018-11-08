// panel/file.js

var FileTree = function(c) {
    FileTree.superclass.constructor.call(this, Ext.apply({
        loader: new StatusLoader(Ext.apply({
            uiProviders: {
                'col': Ext.tree.ColumnNodeUI
            },
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
        cls: "file-size"
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
    createNode: function(attr) {
        //attr.iconCls = attr.type;
        // 00: lrwxrwxrwx         20 1970-01-01 08:00:00.000 Customer
        var line = attr.text;
        var pos = 4;
        attr.mode = line.substring(pos, pos + 10); pos += 11;
        attr.size = parseInt(line.substring(pos, pos + 10).trim()); pos += 11;
        attr.date = line.substring(pos, pos + 10); pos += 11;
        attr.time = line.substring(pos, pos + 8); pos += 13;
        attr.name = line.substring(pos);
        var sl = attr.name.indexOf(" -&gt ");
        if (sl > 0) {
            attr.symlink = attr.name.substring(sl + 6);
            attr.name = attr.name.substring(0, sl);
        }
        attr.text = attr.name;
        attr.uiProvider = "col";
        return StatusLoader.prototype.createNode.call(this, attr);
    }
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
});

