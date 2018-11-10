// panels/endpoint.js

// This is the main content center region that will contain each example layout panel.
// It will be implemented as a CardLayout since it will contain multiple panels with
// only one being visible at any given time.
var EndpointTab = function(c) {
    var c1 = Ext.apply({}, c);
    delete c.title;
    delete c.closable;
    delete c.region;
    EndpointTab.superclass.constructor.call(this, Ext.apply({
        items: [
            new LogPanel(Ext.apply({
                step: 0, 
            }, c)),
            new StatusPanel(c), 
            new FilePanel(c), 
            new MmapPanel(c), 
            new JTracePanel(c), 
            new NTracePanel(c), 
            new CommandPanel(c)
        ]
    }, c1));
};

Ext.extend(EndpointTab, Ext.TabPanel, {
    border: false, 
    activeTab: 0
});

var EndpointPanel = function(c) {
    EndpointPanel.superclass.constructor.call(this, Ext.apply({
        items: [
            new EndpointTab(Ext.apply({
                region: 'center'
            }, c))
        ]
    }, c));
}

Ext.extend(EndpointPanel, Ext.Panel, {
    title: '进程',
    layout: 'border'
});
