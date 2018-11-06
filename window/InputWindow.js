// window/InputWindow.js

var InputWindow = function(c) {
    c = Ext.applyIf(c || {}, {
        layout: 'fit',
        width: 410,
        closeAction: 'hide',
        plain: true,
        title: '输入',
        items: [{
            xtype: 'fieldset',
            border: false, 
            defaultType: 'textfield',
            items: [{
                allowBlank: false,
                hideLabel: true,
                width: '380'
            }]
        }],
        buttons: [{
            text: '确认',
            scope: this, 
            handler: function() {
                var form = this.items.get(0);
                var val = form.items.get(0).getValue();
                this.onOK(val);
                this.hide();
            }
        }, {
            text: '取消',
            scope: this, 
            handler: function() {
                this.hide();
            }
        }]
    });
    InputWindow.superclass.constructor.call(this, c);
};

Ext.extend(InputWindow, Ext.Window);

InputWindow.input = function(title, callback) {
    this.instance = this.instance || new InputWindow({
    });
    this.instance.setTitle(title);
    this.instance.onOK = callback;
    this.show();
}
