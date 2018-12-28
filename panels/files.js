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
        }
    ];
    FileList.superclass.constructor.call(this, Ext.apply({
        title: '目录 - /',
        collapsible: true,
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
                        grid.removeFile(grid.getPath(record));
                        break;
                    case 'get':
                        grid.saveFile(grid.getPath(record), 
                                record.get("mode").startsWith('d'));
                        break;
                }
            }
        }, 
    }),
    getPath: function(row) {
        var path = this.title.substring(5);
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
        this.setTitle('目录 - ' + path);
        this.store.proxy.url = this.store.proxy.url.replace(/_=.+/, 
                "_=" + encodeURIComponent(path));
        this.store.reload();
    },
    saveFile: function(path, directory) {
        var name = path.replace(/.*\//g, "");
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
    getPreview: function(row, callback) {
        if (typeof row == 'number') {
            row = this.store.getAt(row);
        }
        var name = row.get('name');
        var type = deviceLoader.getType(name);
        var dir = row.get("mode").startsWith('d');
        var url = this.store.proxy.url;
        var path = this.getPath(row);
        if (dir) {
            url = url.replace(/_=.+/, "_=");
            type = 'text';
        } else {
            url = url.replace(/list\?.+/, "get/" + name +  "?_=");
        }
        url += encodeURIComponent(path);
        if (type == 'binary') {
            if (row.get('size') <= 100 * 1024) {
                type = 'text';
            }
        }
        callback(type, url);
    }
});

var PreviewPanel = function(c) {
    PreviewPanel.superclass.constructor.call(this, Ext.apply({
        items: [{
            xtype: 'label', 
            text: '预览'
        }]
    }, c));
}

Ext.extend(PreviewPanel, Ext.Panel, {
    layout:'card',
    iconCls: "screen-tab",
    activeItem: 0,
    setPreview: function(type, url) {
        var panel = panels[type];
        if (typeof panel == 'function') {
            panel = new panel({
                header: false,
                datasrc: {
                    url: url
                }
            });
        }
        if (panel == null) {
            panel = new Ext.Panel({
                html: '<div><a href=\"' + url + '\" target=\"_blank\">' + url + '</a></div>'
            })
        }
        this.add(panel);
        this.remove(this.items.get(0));
        this.layout.setActiveItem(0);
        panel.fireEvent('activate', panel);
    }
});

var FilesPanel = function(c) {
    var list = new FileList(Ext.apply({
        region: 'west', 
        width: 560,
    }, c));
    var preview = new PreviewPanel(Ext.apply({
        region: 'center',
        border: true,
    }));
    FilesPanel.superclass.constructor.call(this, Ext.apply({
        items: [list, preview]
    }, c));
    list.on("rowclick", function(grid, row) {
        preview.setPreview('text', '预览');
        console.log("preview");
        if (this.previewDelayed) {
            clearTimeout(this.previewDelayed);
            this.previewDelayed = 0;
        }
        this.previewDelayed = setTimeout(function() {
            console.log("preview2");
            list.getPreview(row, function(type, url) {
                preview.setPreview(type, url);
            }.bind(this));
        }.bind(this), 1000);
    }.bind(this));
    list.on("rowdblclick", function() {
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

