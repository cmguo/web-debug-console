// panel/text.js

var TextPanel = function(c) {
    TextPanel.superclass.constructor.call(this, Ext.apply({
        proxy: DataStore.createProxy(c), 
        activeItem: 0, 
        layout: 'card', 
        items: [{
            xtype: 'textarea',
            border: false
        }]
    }, c));
}

Ext.extend(TextPanel, Ext.Panel, {
    border: false,
    listeners: {
        activate: function() {
            this.load();
        }
    }, 
    load: function() {
        this.proxy.loadData(function(response) {
            //this.value = response;
            this.items.get(0).setRawValue(response);
        }.bind(this));
    }
});
