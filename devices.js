// panels.js

// Go ahead and create the TreePanel now so that we can use it below
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
        text        : '根节点',
    }),

    loader: {
        load: function(node, callback) {
            if (node.attributes.type == "device") {
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
                            }
                            if (--left == 0) {
                                node.endUpdate();
                                callback(this, node);
                            }
                        },
                        failure: function (respons) {
                        }
                    });
                }
            }
        }
    },

    listeners: {
        dblclick: function(node) {
            if (node.attributes.url) {
                treePanel1.switch_endpoint(node.attributes.url);
            }
        }
    },

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
        complete: function(editor, value) {
            var device = editor.editNode;
            device.attributes.addr = value;
            device.reload();
        }
    }
});
