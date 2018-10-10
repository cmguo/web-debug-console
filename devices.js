// devices.js

var deviceLoader = {

    saveRoot: function(node) {
        var devices = node.childNodes.map(function(n) {
            return n.attributes.addr;
        });
        window.localStorage.devices = Ext.util.JSON.encode(devices);
    },

    loadRoot(node, callback) {
        var devices = window.localStorage.devices || "[]";
        devices = eval("("+devices+")");
        devices.forEach(function(d) {
            var device = new Ext.tree.AsyncTreeNode({
                text: d, 
                addr: d, 
                type: "device"
            });
            node.appendChild(device);
        });
        callback(this, node);
    },

    loadDevice: function(node, callback) {
        var left = 20;
        node.beginUpdate();
        for (var port = 8080; port < 8100; ++port) {
            Ext.Ajax.request({
                url: "http://" + node.attributes.addr + ":" + port + "/jsondump?_=httpm&o=", 
                dataType: "json", 
                callback: function (options, success, response) {
                    if (success) {
                        var json = response.responseText;
                        var o = eval("("+json+")");
                        deviceLoader.addEndpoint(node, o);
                    }
                    if (--left == 0) {
                        node.endUpdate();
                        callback(this, node);
                    }
                }
            });
        }
    },

    addEndpoint: function(node, o) {
        var pack = node.findChild("pack", o.Package);
        if (!pack && o.Package != o.Process) {
            pack = new Ext.tree.TreeNode({
                pack: o.Package,
                port: o.mPort,
                text: o.Package
            });
            node.appendChild(pack);
        }
        var endpoint = new Ext.tree.TreeNode({
            pack: o.Package,
            port: o.mPort,
            url: "http://" + node.attributes.addr + ":" + o.mPort + "/"
        });
        if (pack) {
            if (pack.attributes.url) {
                pack.appendChild(new Ext.tree.TreeNode({
                    pack: o.Package,
                    text: "[Main](" + pack.attributes.port + ")", 
                    port: pack.attributes.port,
                    url: pack.attributes.url
                }));
                pack.attributes.text = o.Package;
                delete pack.attributes.url;
                delete pack.attributes.port;
            }
            endpoint.text = o.Package == o.Process ? "[Main]" : o.Process.substring(o.Package.length + 1);
            endpoint.text += "(" + o.mPort + ")";
            pack.appendChild(endpoint);
        } else {
            endpoint.text = o.Package + "(" + o.mPort + ")";
            node.appendChild(endpoint);
        }
    },

    load: function(node, callback) {
        if (node.attributes.type == "root") {
            this.loadRoot(node, callback);
        } else if (node.attributes.type == "device") {
            this.loadDevice(node, callback);
        }
    }
};

var treePanel2 = new Ext.tree.TreePanel({
    id: 'device-panel',
    title: '设备',
    region:'center',
    autoScroll: true,
    collapsible: true,

    // tree-specific configs:
    rootVisible: false,
    lines: false,
    useArrows: true,

    root: new Ext.tree.AsyncTreeNode({
        text: '根节点',
        type: "root"
    }),

    loader: deviceLoader,

    save: function() {
        this.loader.saveRoot(this.getRootNode());
    },

    listeners: {
        dblclick: function(node) {
            if (node.attributes.url) {
                treePanel1.switch_endpoint(node.attributes.url);
            }
        },
        contextmenu: function(node, e) {
            node.select();
            if (node.attributes.type == "device") {
                var c = node.getOwnerTree().contextMenu;
                c.contextNode = node;
                c.showAt(e.getXY());
            }
        }
    },

    contextMenu: new Ext.menu.Menu({
        items: [{
            id: 'refresh',
            text: '刷新'
        }],
        listeners: {
            itemclick: function(item) {
                switch (item.id) {
                    case 'refresh':
                        var n = item.parentMenu.contextNode;
                        n.reload();
                        break;
                }
            }
        }
    }),

    buttons: [{
        text: "添加设备", 
        handler: function() {
            var device = new Ext.tree.AsyncTreeNode({
                text: "输入IP", 
                type: "device"
            });
            treePanel2.getRootNode().appendChild(device);
            var editor = treePanel2.editor;
            editor.triggerEdit(device);
        }
    }]
});

treePanel2.editor = new Ext.tree.TreeEditor(treePanel2, {}, {
    completeOnEnter: true,
    ignoreNoChange: true, 
    listeners: {
        beforestartedit: function(editor) {
            var node = editor.editNode;
            return node.attributes.type == "device";
        },
        complete: function(editor, value) {
            var device = editor.editNode;
            device.attributes.addr = value;
            device.reload();
            treePanel2.save();
        }
    }
});
