/*
 * Ext JS Library 2.2
 * Copyright(c) 2006-2008, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.onReady(function(){
    
    Ext.QuickTips.init();

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
    var treePanel = new Ext.tree.TreePanel({
        id: 'tree-panel',
        title: '面板',
        region:'west',
        split: true,
        width: 140,
        minSize: 140,
        autoScroll: true,
        collapsible: true,
        
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
    treePanel.on('click', function(n){
        var sn = this.selModel.selNode || {}; // selNode is null on initial selection
        if(n.leaf && n.id != sn.id){  // ignore clicks on folders and currently selected node 
            //Ext.MessageBox.alert('错误', n.getPath());
            var contentPanel = Ext.getCmp('content-panel');
            if (!contentPanel.getComponent(n.id + '-panel'))
                contentPanel.add(menu_def.get_panel(n.id))
            contentPanel.layout.setActiveItem(n.id + '-panel');
        }
    });
    
    var opPanel = {
        id: 'op-panel',
        region:'center',
        margins:'0 5 5 0',
        layout:'border',
        autoScroll:true,
        items: [treePanel, contentPanel]
    };

    var mainPanel = {
        id: 'main-panel',
        region: 'center', // this is what makes this panel into a region within the containing layout
        layout: 'card',
        margins: '2 5 5 0',
        activeItem: 'login-panel',
        border: false,
        items: [opPanel]
    };

    var headerPanel = {
        id          : 'header', 
        region      : 'north',
        layout      : 'column', 
        height      : 30, 
        style       : 'background: #7F99BE', 
        items	    : [{
            width       : 140, 
            html        : '<h1>远程调试平台</h1>'
        }, {
            html        : 'dddddddddd'
        }]
    };

    var task = {
        run: function(){
            var layout = Ext.getCmp('content-panel').layout;
            if (typeof(layout.activeItem.refresh) == 'function')
                layout.activeItem.refresh();
        },
        interval: 1000 * 300 //300 second
    }
    Ext.TaskMgr.start(task);
    
    // Finally, build the main layout once all the pieces are ready.  This is also a good
    // example of putting together a full-screen BorderLayout within a Viewport.
    new Ext.Viewport({
        layout: 'border',
        items: [{
            xtype: 'box',
            region: 'north',
            applyTo: 'header',
            height: 30
        },
            opPanel
        ],
        renderTo: Ext.getBody()
    });
});
