// panels/endpoint.js

// This is the main content center region that will contain each example layout panel.
// It will be implemented as a CardLayout since it will contain multiple panels with
// only one being visible at any given time.
var PackageTab = function(c) {
    var c1 = Ext.apply({}, c);
    delete c.title;
    delete c.closable;
    delete c.region;
    PackageTab.superclass.constructor.call(this, Ext.apply({
        items: [
            blankPanel
        ]
    }, c1));
};

Ext.extend(PackageTab, Ext.TabPanel, {
    border: false, 
    activeTab: 0
});

var PackageTree = function(c) {
    PackageTree.superclass.constructor.call(this, Ext.apply({
        loader: new StatusLoader(Ext.apply({
            createNode: function(attr) {
                //attr.iconCls = attr.type;
                // #00: lrwxrwxrwx         20 1970-01-01 08:00:00.000 Customer
                var line = attr.text;
                if (line.charAt(0) != '#') return null;
                var pos = line.indexOf(": ") + 2;
                line = line.substring(pos).replace("&gt", ">");
                var file = FlstReader.prototype.readRecord(line);
                attr.text = file.name;
                return StatusLoader.prototype.createNode.call(this, attr);
            }
        }, c)),
        root: new Ext.tree.AsyncTreeNode({
            text: '/',
            id: 'debug/file/###'
        })
    }, c));
}

Ext.extend(PackageTree, Ext.tree.TreePanel, {
    title: '目录',
    autoScroll: true,
    rootVisible: false,
    collapsible: true
});

var PackagePanel = function(c) {
    var tree = new PackageTree(Ext.apply({
        region: 'west',
        width: 300
    }, c));
    var tab = new PackageTab(Ext.apply({
        region: 'center'
    }, c));
    tree.on("click", function(node) {
        if (node.attributes.panel) {
            tab.setActiveTab(node.attributes.panel);
            return;
        }
        if (!node.leaf) {
            return;
        }
        var type = deviceLoader.getType(node.text);
        var panel = panels[type];
        if (typeof panel == "function") {
            var path = "";
            var node2 = node;
            while (node2) {
                if (node2.attributes.text != '/')
                    path = "/" + node2.attributes.text + path;
                node2 = node2.parentNode;
            }
            panel = new panel({
                title: node.attributes.text, 
                closable: true,
                datasrc: {
                    url: tree.loader.url.replace("jsontree", "file.get?_=") 
                        + encodeURIComponent(path)
                }
            });
        }
        if (panel) {
            tab.add(panel);
            tab.setActiveTab(panel);
            node.attributes.panel = panel;
        }
    });
    PackagePanel.superclass.constructor.call(this, Ext.apply({
        items: [
            tree,  
            tab
        ]
    }, c));
}

Ext.extend(PackagePanel, Ext.Panel, {
    title: '目录',
    layout: 'border'
});
