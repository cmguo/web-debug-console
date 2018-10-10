// command.js

var command_loader = new Ext.tree.TreeLoader({
    url: "none", 
    requestMethod: "GET",
    baseParams: {
        splitvalue: ""
    },
    createNode: function(attr) {
        //attr.iconCls = attr.type;
        return Ext.tree.TreeLoader.prototype.createNode.call(this, attr);
    }
});
command_loader.getParams = function(node){
    var buf = [], bp = this.baseParams;
    for(var key in bp){
        if(typeof bp[key] != "function"){
            buf.push(encodeURIComponent(key), "=", encodeURIComponent(bp[key]), "&");
        }
    }
    return buf.join("");
}
command_loader.on("beforeload", function(treeLoader, node) {
    if (this.url == "none")
        return false;
    if (node.attributes.id == "/") {
        this.baseParams._ = "console/mCommands";
    } else {
        this.baseParams._ = node.attributes.id + "/mSubCommands";
    }
    return true;
}, command_loader);

var panel_command = {
    id: 'command-panel', 
    title: '命令', 
    region: "west",
    width: 200,
    bodyBorder: false,
    autoScroll: true,
    rootVisible: false,
    root: new Ext.tree.AsyncTreeNode({
        id: "/", 
        text: "All Commands"
    }),
    loader: command_loader,
    set_url: function(url) {
        url = url + "jsontree";
        if ( this.loader.url != url) {
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
    }
}

var commandTree = new Ext.tree.TreePanel(panel_command);

var argList = new Ext.grid.GridPanel({
    region: 'center', 
    title: '参数',
    columns: [{
        id: 'name', 
        header : '名称', 
        width: 100
    }, {
        id: 'value', 
        header : '数值', 
        width: 200
    }, {
        id: 'desc', 
        header: '描述', 
        width: 600
    }], 
    store: new Ext.data.Store({
    }),
    buttons: [{
        text: '添加参数'
    }, {
        text: '执行'
    }]
});

var detailPanel = new Ext.Panel({
    region: 'center',
    layout: 'border',
    items: [{
        xtype: 'label', 
        height: 60,
        region: 'north'
    }, argList, {
        xtype: 'textfield',
       height: 160,
    text: 'ssssssssssssssssssssssssssss',
        region: 'south'
    }]
});

var commandPanel = new Ext.Panel({
    title: '命令',
    layout: 'border',
    items: [
        commandTree, 
        detailPanel
    ],
    set_url: function(url) {
        commandTree.set_url(url);
    }
});

