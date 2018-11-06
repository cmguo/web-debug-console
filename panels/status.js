// status.js

var status_loader = new Ext.tree.TreeLoader({
    url: "none", 
    requestMethod: "GET",
    createNode: function(attr) {
        //attr.iconCls = attr.type;
        return Ext.tree.TreeLoader.prototype.createNode.call(this, attr);
    }
});
status_loader.getParams = function(node){
    var buf = [], bp = this.baseParams;
    for(var key in bp){
        if(typeof bp[key] != "function"){
            buf.push(encodeURIComponent(key), "=", encodeURIComponent(bp[key]), "&");
        }
    }
    return buf.join("");
}
status_loader.on("beforeload", function(treeLoader, node) {
    if (this.url == "none")
        return false;
    this.baseParams._ = node.attributes.id;
    return true;
}, status_loader);

var panel_status = {
    id: 'status-panel', 
    title: '状态', 
    bodyBorder: false,
    autoWidth: true, 
    autoScroll: true,
    rootVisible: false,
    root: new Ext.tree.AsyncTreeNode({
        id: "/", 
        text: "All Status"
    }),
    loader: status_loader,
    set_url: function(url) {
        url = url + "jsontree";
        if (this.loader.url != url) {
            this.loader.url = url;
            this.getRootNode().reload();
        }
    },
    listeners : {
        beforecollapsenode: function(node) {
            while(node.firstChild){
                node.removeChild(node.firstChild);
            }
            node.loaded = false;
        },
        contextmenu: function(node, e) {
            node.select();
            var c = node.getOwnerTree().contextMenu;
            c.contextNode = node;
            c.showAt(e.getXY());
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
}

var statusPanel = new Ext.tree.TreePanel(panel_status);
