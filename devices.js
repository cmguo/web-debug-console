// devices.js

var jiraOptions = {
    "bugfree": {
        headers: {
            Authorization: "Basic cHBib3gtcm9tOlJvb20xMjM0NTY3"
        }
    }, 
    "newjira.cnsuning.com": {
        headers: {
            Authorization: "Basic MTYwOTE4ODA6V0FMbHBhcGVyMTIzNDU2Nw=="
        }
    }
}

var rpc = { loaded: function() {} };
RPC.new("./worker.js", rpc).then(function(r) {
    rpc = r;
});

function clickElem(elem) {
    // Thx user1601638 on Stack Overflow (6/6/2018 - https://stackoverflow.com/questions/13405129/javascript-create-and-save-file )
    var eventMouse = document.createEvent("MouseEvents")
    eventMouse.initMouseEvent("click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null)
    elem.dispatchEvent(eventMouse)
}

function jsonp(url, callback) {
    var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
    window[callbackName] = function(data) {
        delete window[callbackName];
        document.body.removeChild(script);
        callback(data);
    };

    var script = document.createElement('script');
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
    document.body.appendChild(script);
}

var deviceLoader = {

    saveRoot: function(node) {
        var devices = [];
        node.childNodes.forEach(function(n) {
            if (!n.attributes.file)
                devices.push(n.attributes);
        });
        window.localStorage.devices = Ext.util.JSON.encode(devices);
    },

    loadRoot(node, callback) {
        var devices = window.localStorage.devices || "[]";
        devices = eval("("+devices+")");
        devices.forEach(function(d) {
            var device = new Ext.tree.AsyncTreeNode(d);
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
        var reader;
        if (node.attributes.file)
            reader = new zip.BlobReader(node.attributes.file);
        else
            reader = new zip.HttpReader(node.attributes.url);
        var getText = function(callback) {
            this.getData(new zip.TextWriter(), function(text) {
                callback(text);
            });
        }
        var thiz = this;
        zip.createReader(reader, function(zipReader) {
            node.attributes.reader = zipReader;
            zipReader.getEntries(function(entries) {
                entries.forEach(function(entry) {
                    entry.getText = getText;
                    var device = new Ext.tree.TreeNode({
                        text: entry.filename, 
                        type: "logentry", 
                        entry: entry
                    });
                    node.appendChild(device);
                });
                thiz.sort(node);
                callback(this, node);
            }, function(msg) {
            });
        });
    },

    loadRar: function(node, callback) {
        var getText = function(callback) {
            var text = new TextDecoder("utf-8").decode(this.fileContent);
            callback(text);
        };
        var rec = function(entry) {
            if(entry.type === 'file') {
                entry.getText = getText;
                var device = new Ext.tree.TreeNode({
                    text: entry.fullFileName, 
                    type: "logentry", 
                    entry: entry
                });
                node.appendChild(device);
            } else if(entry.type === 'dir') {
                Object.keys(entry.ls).forEach(function(k) {
                    rec(entry.ls[k])
                })
            } else {
                throw "Unknown type"
            }
        }
        var reader;
        if (node.attributes.file)
            reader = new zip.BlobReader(node.attributes.file);
        else
            reader = new zip.HttpReader(node.attributes.url);
        var thiz = this;
        reader.init(function() {
            reader.readUint8Array(0, reader.size, function(bytes) {
                var data = [{name: node.attributes.text, content: bytes}];
                rpc.unrar(data, null).then(function(ret) {
                    rec(ret);
                    thiz.sort(node);
                    callback(this, node);
                });
            });
        });
    },

    loadRar_: function(node, callback) {
        var rar;
        if (node.attributes.file) {
            rar = Rar.fromFile(node.attributes.file);
        } else {
            rar = Rar.fromUri(node.attributes.url, node.attributes.opts);
        }
        rar.then((archive) => {
            node.attributes.archive = archive;
            var getText = function(callback) {
                archive.get(this).then((entry) => {
                    var reader = new FileReader();
                    reader.onload = function() {
                        callback(reader.result);
                    }
                    reader.readAsText(entry);
                });
            }
            archive.entries.forEach(function(entry) {
                entry.getText = getText;
                var device = new Ext.tree.TreeNode({
                    text: entry.name, 
                    type: "logentry", 
                    entry: entry
                });
                node.appendChild(device);
            });
            callback(this, node);
        });
    },

    loadJira: function(node, callback) {
        var thiz = this;
        Ext.Ajax.request(Ext.apply({
            url: node.attributes.url, 
            disableCaching: false, 
            success: function(response) {
                var json = response.responseText;
                var o = eval("("+json+")");
                o.fields.attachment.forEach(function(a) {
                    var url = new URL(a.content);
                    url.pathname = "/" + node.attributes.host + url.pathname;
                    if (a.filename.endsWith(".zip")) {
                        var device = new Ext.tree.AsyncTreeNode({
                            text: a.filename, 
                            type: "logzip", 
                            url: url.toString(), 
                            opts: node.attributes.opts
                        });
                        node.appendChild(device);
                    } else if (a.filename.endsWith(".rar")) {
                        var device = new Ext.tree.AsyncTreeNode({
                            text: a.filename, 
                            type: "lograr", 
                            url: url.toString(), 
                            opts: node.attributes.opts
                        });
                        node.appendChild(device);
                    } else {
                        var device = new Ext.tree.TreeNode({
                            text: a.filename, 
                            type: "logfile", 
                            url: url.toString(), 
                            opts: node.attributes.opts
                        });
                        node.appendChild(device);
                    }
                });
                thiz.sort(node);
                callback(this, node);
            }
        }, node.attributes.opts));
    }, 

    sort: function(node) {
        var c = node.firstChild;
        while (c) {
            var a = c.attributes;
            var t = a.text + ".";
            var s = 1;
            var d = node.findChild("text", t + String(s));
            while (d) {
                a.next = d.attributes;
                a = d.attributes;
                d.remove();
                ++s;
                d = node.findChild("text", t + String(s));
            }
            if (s > 1)
                c.text = c.text + "[" + String(s) + "]";
            c = c.nextSibling;
        };
    }, 

    addEndpoint: function(node, o) {
        var pack = node.findChild("pack", o.Package);
        if (!pack && o.Package != o.Process) {
            pack = new Ext.tree.TreeNode({
                type: 'app',
                pack: o.Package,
                port: o.mPort,
                text: o.Label
            });
            node.appendChild(pack);
        }
        var endpoint = new Ext.tree.TreeNode({
            type: 'endpoint',
            pack: o.Package,
            port: o.mPort,
            url: "http://" + node.attributes.addr + ":" + o.mPort + "/", 
            text: o.Label + "(" + o.mPort + ")"
        });
        if (pack) {
            if (pack.attributes.url) {
                pack.appendChild(new Ext.tree.TreeNode({
                    type: 'endpoint',
                    pack: o.Package,
                    text: "[Main](" + pack.attributes.port + ")", 
                    port: pack.attributes.port,
                    url: pack.attributes.url
                }));
                pack.attributes.text = o.Label;
                pack.type = 'app';
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
        } else if (node.attributes.type == "lograr") {
            this.loadRar(node, callback);
        } else if (node.attributes.type == "logjira") {
            this.loadJira(node, callback);
        }
    }, 

    addFile: function() {
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
            } else if (file.name.endsWith(".rar")) {
                var device = new Ext.tree.AsyncTreeNode({
                    text: file.name,
                    type: "lograr", 
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
    },

    addJira: function(id) {
        var host = "bugfree";
        if (id.indexOf("://") > 0) { 
            var url = new URL(id);
            host = url.hostname;
            id = url.pathname.split("/").slice(-1)[0];
            url.pathname = "/" + host + url.pathname;
        }
        if (id.indexOf(".") < 0) {
            var device = new Ext.tree.AsyncTreeNode({
                text: id, 
                type: "logjira",
                host: host, 
                opts: jiraOptions[host], 
                url: "/" + host + "/rest/api/2/issue/" + id
            });
            devicePanel.getRootNode().appendChild(device);
        } else if (id.endsWith(".zip")) {
            var device = new Ext.tree.AsyncTreeNode({
                text: id, 
                type: "logzip",
                opts: jiraOptions[host], 
                url: url.pathname
            });
            devicePanel.getRootNode().appendChild(device);
        } else if (id.endsWith(".rar")) {
            var device = new Ext.tree.AsyncTreeNode({
                text: id, 
                type: "lograr",
                opts: jiraOptions[host], 
                url: url.pathname
            });
            devicePanel.getRootNode().appendChild(device);
        } else {
            var device = new Ext.tree.TreeNode({
                text: id, 
                type: "logfile",
                opts: jiraOptions[host], 
                url: url.pathname
            });
            devicePanel.getRootNode().appendChild(device);
        }
        devicePanel.save();
    }
};

var InputWindow = function(c) {
    c = Ext.applyIf(c || {}, {
        layout: 'fit',
        width: 410,
        closeAction: 'hide',
        plain: true,
        title: '输入',
        items: [{
            xtype: 'fieldset',
            border: false, 
            defaultType: 'textfield',
            items: [{
                allowBlank: false,
                hideLabel: true,
                width: '380'
            }]
        }],
        buttons: [{
            text: '确认',
            scope: this, 
            handler: function() {
                var form = this.items.get(0);
                var val = form.items.get(0).getValue();
                this.onOK(val);
                this.hide();
            }
        }, {
            text: '取消',
            scope: this, 
            handler: function() {
                this.hide();
            }
        }]
    });
    InputWindow.superclass.constructor.call(this, c);
};

Ext.extend(InputWindow, Ext.Window);

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
            if (node.attributes.panel) {
                contentPanel.setActiveTab(node.attributes.panel);
            } else if (node.attributes.type == 'endpoint') {
                contentPanel.switch_endpoint(node.attributes.url);
            } else if (node.attributes.type == 'logfile' 
                || node.attributes.type == 'logentry') {
                var panel = new LogPanel({
                    title: node.attributes.text, 
                    closable: true,
                    store: new TextLogStore({
                        datasrc: node.attributes
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
                        devicePanel.save();
                        break;
                }
            }
        }
    }),

    buttons: [{
        text: "设备",
        minWidth: 40, 
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
        text: "日志", 
        minWidth: 40, 
        handler: function() {
            devicePanel.loader.addFile();
        }
    }, {
        text: "JIRA", 
        minWidth: 40, 
        handler: function() {
            new InputWindow({
                title: "输入JIRA地址", 
                onOK: devicePanel.loader.addJira.bind(devicePanel.loader)
            }).show();
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
            device.attributes.text = value;
            device.attributes.addr = value;
            device.reload();
            devicePanel.save();
        }
    }
});
