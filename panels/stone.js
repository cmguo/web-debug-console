// panels/stone.js

var StoneTab = function(c) {
    var store = new StoneStore(c);
    var textArea = new Ext.form.TextArea({

    });
    var items = [{
            id      : 'blank-panel',
            title: '概要',
            layout  : 'fit',
            items: [
                textArea
            ]
        },
        new LogPanel({title: '日志(S)', record: 'logsystem', datasrc: {}}),
        new LogPanel({title: '日志(M)', record: 'logmain', datasrc: {}}),
        new MmapPanel({record: 'memorys', datasrc: {}}), 
        new TracePanel({record: 'threads', datasrc: {}})
    ];
    StoneTab.superclass.constructor.call(this, Ext.apply({
        items: items
    }, c));
    store.on('load', function(store, records) {
        var r = records[0];
        textArea.setRawValue(r.get("system").join("\r\n"));
        items.forEach(function (p) {
            if (p.store) {
                p.store.loadData(r.get(p.record));
            }
        });
    });
    this.store = store;
};

Ext.extend(StoneTab, Ext.TabPanel, {
    border: false, 
    activeTab: 0
});

var StonePanel = function(c) {
    StonePanel.superclass.constructor.call(this, Ext.apply({
        items: [
            new StoneTab(Ext.apply({
                region: 'center'
            }, c))
        ]
    }, c));
}

Ext.extend(StonePanel, Ext.Panel, {
    title: '墓碑',
    layout: 'border',
    listeners: {
        activate: function() {
            this.items.get(0).store.load();
        }
    }
});
