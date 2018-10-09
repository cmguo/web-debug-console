/*
 * Ext JS Library 2.2
 * Copyright(c) 2006-2008, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.onReady(function(){
    
    Ext.QuickTips.init();

    var leftPanel = {
        id: 'left-panel',
        layout:'border',
        region:'west',
        margins:'0 5 5 0',
        width: 200,
        autoScroll:true,
        items: [treePanel1, treePanel2]
    };

    var mainPanel = {
        id: 'main-panel',
        region: 'center', // this is what makes this panel into a region within the containing layout
        layout: 'border',
        margins: '2 5 5 0',
        border: false,
        items: [leftPanel, contentPanel]
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
            mainPanel
        ],
        renderTo: Ext.getBody()
    });
});
