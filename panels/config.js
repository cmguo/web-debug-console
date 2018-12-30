// panels/config.js

var ConfigPanel = function(c) {
    var c1 = Ext.apply({}, c);
    delete c.title;
    delete c.closable;
    ConfigPanel.superclass.constructor.call(this, Ext.apply({
        items: [
            new JiraConfig(c), 
            new LogConfig(c)
        ]
    }, c1));
};

Ext.extend(ConfigPanel, Ext.TabPanel, {
    title: '配置',
    activeItem: 0, 
});
