// panels.js

var menu_def = {
    id          : 'root',
    children    : [], 
    leaf        : false
};

menu_def.add = function(item) {
    var menu_item = this;
    if (typeof(item.path) != 'undefined') {
        var item1 = this.find(item.path);
        if (item1 != null) {
            menu_item = item1;
        }
    }
    if (item.children) {
        item.get_panel = menu_def.get_panel;
    }
    menu_item.children.push(item);
};

menu_def.find = function(path) {
    var arr = path.split('/');
    var menu_item = this;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == '') {
            continue;
        }
        for (var j = 0; j < menu_item.children.length; j++) {
            if (menu_item.children[j].id == arr[i]) {
                break;
            }
        }
        if (j == menu_item.children.length) {
            break;
        }
        menu_item = menu_item.children[j];
    }
    if (i != arr.length) {
        return null;
    }
    return menu_item;
};

menu_def.get_panel = function (id) {
    for (var j = 0; j < this.children.length; j++) {
        if (this.children[j].leaf && this.children[j].id == id) {
            if (this.children[j].panel instanceof Function)
                this.children[j].panel = this.children[j].panel(); 
            return this.children[j].panel;
        } else if (this.children[j].get_panel) {
            panel = this.children[j].get_panel(id);
            if (panel)
                return panel;
        }
    }
    return null;
};

menu_def.get_panels = function () {
    var panels = [];
    var get_panels = function (menu_item) {
        for (var j = 0; j < menu_item.children.length; j++) {
            if (menu_item.children[j].leaf) {
                if (menu_item.children[j].panel instanceof Function)
                    menu_item.children[j].panel = menu_item.children[j].panel(); 
                panels.push(menu_item.children[j].panel);
            } else {
                get_panels(menu_item.children[j]);
            }
        }
    }
    get_panels(this);
    return panels;
};

var blank_panel = {
    id      : 'blank-panel',
    layout  : 'fit'
};

// This is the main content center region that will contain each example layout panel.
// It will be implemented as a CardLayout since it will contain multiple panels with
// only one being visible at any given time.
var contentPanel = {
    id: 'content-panel',
    region: 'center', // this is what makes this panel into a region within the containing layout
    layout: 'card',
    margins: '2 5 5 0',
    activeItem: 'blank-panel',
    border: false,
    deferredRender: true, 
    items: [blank_panel] // menu_def.get_panels()
};

// Go ahead and create the TreePanel now so that we can use it below
var treePanel1 = new Ext.tree.TreePanel({
    id: 'select-panel',
    title: '面板',
    region:'north',
    width: 140,
    autoScroll: true,

    // tree-specific configs:
    rootVisible: false,
    lines: false,
    useArrows: true,

    //root: new Ext.tree.AsyncTreeNode({
    //    text        : '根节点',
    //    children    : menu_def.children
    //})
    root    : menu_def
});

// Assign the changeLayout function to be called on tree node click.
treePanel1.on('click', function(n){
    var sn = this.selModel.selNode || {}; // selNode is null on initial selection
    if(n.leaf && n.id != sn.id){  // ignore clicks on folders and currently selected node 
        //Ext.MessageBox.alert('错误', n.getPath());
        var contentPanel = Ext.getCmp('content-panel');
        var panel = contentPanel.getComponent(n.id + '-panel');
        if (!contentPanel.getComponent(n.id + '-panel')) {
            panel = menu_def.get_panel(n.id);
            contentPanel.add(panel)
        }
        panel.set_url(treePanel1.url || "");
        contentPanel.layout.setActiveItem(n.id + '-panel');
    }
});

treePanel1.switch_endpoint = function(url) {
    this.url = url;
    var layout = Ext.getCmp('content-panel').layout;
    for (var p in layout.container.items.items) {
        if (p.clear_url)
            p.clear_url();
    }
    var panel = layout.activeItem;
    if (panel.set_url)
        panel.set_url(url);
}
