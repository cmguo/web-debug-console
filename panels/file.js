// panel/file.js

var fileTree = new Ext.tree.ColumnTree({
    region: 'west',
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

    loader: new StatusLoader({
        uiProviders: {
            'col': Ext.tree.ColumnNodeUI
        },
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
        },

    }),

    root: new Ext.tree.AsyncTreeNode({
        text: '/',
        id: 'debug/file'
    }),

    setUrl: function(url) {
        url = url + "jsontree";
        if (this.loader.url != url) {
            this.loader.url = url;
            this.getRootNode().reload();
        }
    }
});

var filePanel = new Ext.Panel({
    title: '存储',
    id: 'panel-file',
    layout: 'border',
    items: [fileTree, {
        xtype: 'textarea',
        itemId: 'file-output',
        region: 'center',
        border: true,
        emptyText: '预览'
    }],
    setUrl: function(url) {
        fileTree.setUrl(url);
    }
});
