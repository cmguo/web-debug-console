// status.js

var statusPanel = new Ext.tree.TreePanel({
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
    loader: new StatusLoader(),
    setUrl: function(url) {
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
});
