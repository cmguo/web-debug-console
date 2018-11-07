// panels.js

var blankPanel = {
    title: "空白",
    id      : 'blank-panel',
    layout  : 'fit'
};

// This is the main content center region that will contain each example layout panel.
// It will be implemented as a CardLayout since it will contain multiple panels with
// only one being visible at any given time.
var contentPanel = new Ext.TabPanel({
    id: 'content-panel',
    region: 'center', // this is what makes this panel into a region within the containing layout
    margins: '2 5 5 0',
    activeItem: 'blank-panel',
    border: false,
    deferredRender: true, 
    items: [
        blankPanel, 
        logPanel, 
        statusPanel, 
        filePanel, 
        jtracePanel, 
        ntracePanel, 
        commandPanel
    ],
    listeners: {
        beforetabchange: function(tab, panel) {
            if (panel.setUrl) {
                panel.setUrl(this.url || "http://localhost/");
            }
        }
    }
});

contentPanel.switchEndpoint = function(url) {
    this.url = url;
    var layout = Ext.getCmp('content-panel').layout;
    var panel = layout.activeItem;
    if (panel.setUrl)
        panel.setUrl(url);
}
