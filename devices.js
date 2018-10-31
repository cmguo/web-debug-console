// devices.js

function clickElem(elem) {
    // Thx user1601638 on Stack Overflow (6/6/2018 - https://stackoverflow.com/questions/13405129/javascript-create-and-save-file )
    var eventMouse = document.createEvent("MouseEvents")
    eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    elem.dispatchEvent(eventMouse)
}

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

    loadZip: function(node, callback) {
        zip.createReader(new zip.BlobReader(node.attributes.file), function(zipReader) {
            node.attributes.reader = zipReader;
            zipReader.getEntries(function(entries) {
                entries.forEach(function(entry) {
                    var device = new Ext.tree.TreeNode({
                        text: entry.filename, 
                        type: "logentry", 
                        entry: entry
                    });
                    node.appendChild(device);
                });
                callback(this, node);
            }, function(msg) {
            });
        });
    },

    addEndpoint: function(node, o) {
        var pack = node.findChild("pack", o.Package);
        if (!pack && o.Package != o.Process) {
            pack = new Ext.tree.TreeNode({
                pack: o.Package,
                port: o.mPort,
                text: o.Label
            });
            node.appendChild(pack);
        }
        var endpoint = new Ext.tree.TreeNode({
            pack: o.Package,
            port: o.mPort,
            url: "http://" + node.attributes.addr + ":" + o.mPort + "/", 
            text: o.Label + "(" + o.mPort + ")"
        });
        if (pack) {
            if (pack.attributes.url) {
                pack.appendChild(new Ext.tree.TreeNode({
                    pack: o.Package,
                    text: "[Main](" + pack.attributes.port + ")", 
                    port: pack.attributes.port,
                    url: pack.attributes.url
                }));
                pack.attributes.text = o.Label;
                pack.text = o.Label;
                delete pack.attributes.url;
                delete pack.attributes.port;
            }
            endpoint.attributes.text = o.Package == o.Process ? "[Main]" : o.Process.substring(o.Package.length + 1);
            endpoint.attributes.text += "(" + o.mPort + ")";
            endpoint.text = endpoint.attributes.text;
            pack.appendChild(endpoint);
        } else {
            node.appendChild(endpoint);
        }
    },

    load: function(node, callback) {
        if (node.attributes.type == "root") {
            this.loadRoot(node, callback);
        } else if (node.attributes.type == "device") {
            this.loadDevice(node, callback);
        } else if (node.attributes.type == "logzip") {
            this.loadZip(node, callback);
        }
    }, 

    loadFile: function() {
        var readFile = function(e) {
            var file = e.target.files[0];
            if (!file) {
                return;
            }
            if (file.name.endsWith(".zip")) {
                var device = new Ext.tree.AsyncTreeNode({
                    text: file.name,
                    type: "logzip", 
                    file: file
                });
                devicePanel.getRootNode().appendChild(device);
            } else {
                var device = new Ext.tree.TreeNode({
                    text: file.name,
                    type: "logfile", 
                    file: file
                });
                devicePanel.getRootNode().appendChild(device);
            }
            document.body.removeChild(fileInput);
        };
        var fileInput = document.createElement("input");
        fileInput.type='file';
        fileInput.style.display='none';
        fileInput.onchange=readFile;
        document.body.appendChild(fileInput);
        clickElem(fileInput);
    }
};

var devicePanel = new Ext.tree.TreePanel({
    id: 'device-panel',
    title: '设备',
    region:'west',
    width: 200,
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
        click: function(node) {
            if (node.attributes.url) {
                contentPanel.switch_endpoint(node.attributes.url);
            } else if (node.attributes.panel) {
                contentPanel.setActiveTab(node.attributes.panel);
            } else if (node.attributes.type == 'logfile' 
                || node.attributes.type == 'logentry') {
                var panel = new LogPanel({
                    title: node.attributes.text, 
                    closable: true,
                    store: node.attributes.file ? new FileLogStore({
                        file: node.attributes.file
                    }) : new ZipEntryLogStore({
                        entry: node.attributes.entry
                    })
                });
                contentPanel.add(panel);
                contentPanel.setActiveTab(panel);
                node.attributes.panel = panel;
            }
        },
        contextmenu: function(node, e) {
            node.select();
            if (node.parentNode == node.getOwnerTree().getRootNode()) {
                var c = node.getOwnerTree().contextMenu;
                c.contextNode = node;
                c.showAt(e.getXY());
            }
        }, 
        remove: function(tree, parent, node) {
            var remove = function(node) {
                if (node.attributes.panel) {
                    contentPanel.remove(node.attributes.panel);
                } else if (node.hasChildNodes()) {
                    node.eachChild(remove);
                }
            };
            remove(node);
        }
    },

    contextMenu: new Ext.menu.Menu({
        items: [{
            id: 'refresh',
            text: '刷新'
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
                    case 'remove':
                        n.remove();
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
            devicePanel.getRootNode().appendChild(device);
            var editor = devicePanel.editor;
            editor.triggerEdit(device);
        }
    }, {
        text: "打开日志", 
        handler: function() {
            devicePanel.loader.loadFile();
        }
    }]
});

devicePanel.editor = new Ext.tree.TreeEditor(devicePanel, {}, {
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
            devicePanel.save();
        }
    }
});
