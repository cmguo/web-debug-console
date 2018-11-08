// status.js

var StatusPanel = function(c) {
    StatusPanel.superclass.constructor.call(this, Ext.apply({
        root: new Ext.tree.AsyncTreeNode({
            id: "/", 
            text: "All Status"
        }),
        loader: new StatusLoader(c),
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
        })
    }, c));
};

Ext.extend(StatusPanel, Ext.tree.TreePanel, {
    title: '状态', 
    bodyBorder: false,
    autoWidth: true, 
    autoScroll: true,
    rootVisible: false,
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
});
