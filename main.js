/*
 * Ext JS Library 2.2
 * Copyright(c) 2006-2008, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.onReady(function(){
    
    Ext.QuickTips.init();

    var mainPanel = {
        id: 'main-panel',
        region: 'center', // this is what makes this panel into a region within the containing layout
        layout: 'border',
        margins: '2 5 5 0',
        border: false,
        items: [devicePanel, contentPanel]
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
