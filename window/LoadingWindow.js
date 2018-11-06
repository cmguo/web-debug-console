// window/LoadingWindow.js

var LoadingWindow = function(c) {
    var processBar = new Ext.ProgressBar({
    });
    var statusLabel = new Ext.form.Label({
    });
    c = Ext.applyIf(c || {}, {
        width: 400,
        minWidth: 350,
        height: 150,
        header: false,
        modal: true,
        closeAction: 'hide',
        bodyStyle: 'padding:10px;',
        items: [
            statusLabel, 
            processBar
        ]
    });
    LoadingWindow.superclass.constructor.call(this, c);
}

Ext.extend(LoadingWindow, Ext.Window, {
    setProcess: function(msg, total, finish) {
        if (msg == null) {
            this.hide();
            return;
        }
        if (!this.label) {
            this.label = 
        }
    }
});
