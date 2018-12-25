// panels/files.js

var FileList = function(c) {
    var store = c.store || new FlstStore(Ext.applyIf({
        datasrc: Ext.applyIf({
            url: c.datasrc.url + "file.list?l=&_=/"
        }, c.datasrc)
    }, c));
    var colMod = new Ext.grid.ColumnModel({
        defaultSortable: false, 
        columns: [{
            header:'名称',
            width:220,
            dataIndex:'name',
            renderer: (v, p, r) => {
                var dir = r.get('mode').startsWith('d');
                var css = dir ? "file-folder" : "file-file"
                //var img = '<img src="http://extjs.com/s.gif" class="' + cls + '"></img>'
                //var a = '<a hidefocus="on" href="#">' + v + '</a>';
                //return img + a;
                return '<div class=' + css + '>' + v + '</div>';
            }
        },{
            header:'大小',
            width:70,
            dataIndex:'size', 
            css: "text-align: right;",
            renderer: humanFileSize,
        },{
            header:'日期',
            width:80,
            dataIndex:'date'
        },{
            header:'时间',
            width:70,
            dataIndex:'time'
        },{
            header:'模式',
            width:90,
            dataIndex:'mode'
        }]
    });
    var view = new Ext.grid.GridView(c.viewConfig);
    var tbar = ['搜索: ', ' ',
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
            width: 120, 
            height: 300, 
            paramName: "line"
        }), {
            xtype: "button", 
            text: "刷新", 
            handler: function() {
                store.reload();
            }
        }, {
            xtype: "button", 
            scope: this,
            text: "向上", 
            handler: function() {
                this.changeDirectory(this.getPath());
            }
        }, {
            xtype: "label", 
            id: "path",
            text: "/",
            width: 320
        }
    ];
    FileList.superclass.constructor.call(this, Ext.apply({
        region: 'center',
        bodyBorder: false,
        autoWidth: true, 
        enableColumnHide: false, 
        enableColumnMove: false, 
        store: store, 
        cm: colMod, 
        view: view,
        trackMouseOver: false,
        tbar: tbar
    }, c));
}

Ext.extend(FileList, Ext.grid.GridPanel, {
    listeners: {
        activate: function() {
            this.store.load({});
        },
        rowdblclick: function(grid, row) {
            this.changeDirectory(this.getPath(row));
        }, 
        rowcontextmenu: function(grid, row, e) {
            e.preventDefault();
            this.contextMenu.contextList = grid;
            this.contextMenu.contextNode = grid.store.getAt(row);
            this.contextMenu.showAt(e.getXY());
        }
    }, 
    contextMenu: new Ext.menu.Menu({
        items: [{
            id: 'get', 
            scope: this, 
            text: '另存为'
        }, {
            id: 'remove', 
            text: '删除'
        }, {
            id: 'copy',
            text: '拷贝'
        }, {
            id: 'paste',
            text: '粘贴'
        }],
        listeners: {
            itemclick: function(item) {
                var grid = item.parentMenu.contextList;
                var record = item.parentMenu.contextNode;
                switch (item.id) {
                    case 'remove':
                        grid.removeFile(this.getPath(record));
                        break;
                    case 'get':
                        grid.saveFile(this.getPath(record), 
                                record.get("mode").startsWith('d'));
                        break;
                }
            }
        }, 
    }),
    getPath: function(row) {
        var pathLabel = this.getTopToolbar().items.get(5);
        var path = pathLabel.text;
        if (typeof row == 'undefined') {
            path = path.replace(/\/+[^\/]+$/, "");
            if (path == '') path = '/';
        } else {
            if (typeof row == 'number')
                row = this.store.getAt(row);
            var name = row.get('name');
            if (path != '/') path += '/';
            path += name;
        }
        return path;
    },
    changeDirectory: function(path) {
        var pathLabel = this.getTopToolbar().items.get(5);
        pathLabel.setText(path);
        this.store.proxy.url = this.store.proxy.url.replace(/_=.+/, 
                "_=" + encodeURIComponent(path));
        this.store.reload();
    },
    saveFile: function(path, directory) {
        var name = path.replaceAll(/.+\//, "");
        var url = this.store.proxy.url.replace(/list\?.+/, "get?_="
                + encodeURIComponent(path));
        if (directory) {
            url += "&format=zip";
            name += ".zip";
        }
        fetch(url).then(res => {
            const fileStream = streamSaver.createWriteStream(name);
            const writer = fileStream.getWriter();
            // Later you will be able to just simply do
            // res.body.pipeTo(fileStream)
        
            let reader = res.body.getReader()
            let pump = () => reader.read()
                .then(res => res.done
                    ? writer.close()
                    : writer.write(res.value).then(pump))

            pump()
        })
    },
    removeFile: function(path) {
        var url = this.store.proxy.url.replace(/list\?.+/, "remove?_="
                + encodeURIComponent(path));
        var store = this.store;
        fetch(url).then(res => {
            store.reload();
        })
    },
    getPreviewContent: function(row, callback) {
        if (typeof row == 'number') {
            row = this.store.getAt(row);
        }
        if (row.get('size') > 100 * 1024) {
            callback('File too large to preview');
            return;
        }
        var dir = row.get("mode").startsWith('d');
        var url = this.store.proxy.url;
        var path = this.getPath(row);
        url = (dir ? url.replace(/_=.+/, "_=") : url.replace(/list\?.+/, "get?_=")) 
                + encodeURIComponent(path);
        fetch(url).then(res => {
            res.text().then(text => {
                callback(text)
            });
        });
    }
});

var FilesPanel = function(c) {
    FilesPanel.superclass.constructor.call(this, Ext.apply({
        items: [
            new FileList(Ext.apply({
                region: 'west', 
                width: 560,
            }, c)), {
                xtype: 'textarea',
                itemId: 'file-output',
                region: 'center',
                border: true,
                emptyText: '预览'
            }
        ]
    }, c));
    this.items.get(0).on("rowclick", function(grid, row) {
        this.items.get(1).setRawValue('');
        console.log("preview");
        if (this.previewDelayed) {
            clearTimeout(this.previewDelayed);
            this.previewDelayed = 0;
        }
        this.previewDelayed = setTimeout(function() {
            console.log("preview2");
            this.items.get(0).getPreviewContent(row, function(content) {
                this.items.get(1).setRawValue(content);
            }.bind(this));
        }.bind(this), 1000);
    }.bind(this));
    this.items.get(0).on("rowdblclick", function() {
        console.log("cancel");
        if (this.previewDelayed) {
            clearTimeout(this.previewDelayed);
            this.previewDelayed = 0;
        }
    }.bind(this));
};

Ext.extend(FilesPanel, Ext.Panel, {
    title: '存储',
    layout: 'border',
    iconCls: "file-tab",
    listeners: {
        activate: function() {
            this.items.get(0).store.load();
        }
    }, 
});

