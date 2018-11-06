// window/LoadingWindow.js

var LoadingWindow = function(c) {
    var processBar = new Ext.ProgressBar({
        width: 400,
        height: 36,
    });
    c = Ext.applyIf(c || {}, {
        width: 400,
        height: 35,
        header: false,
        border: false, 
        layout: 'fit', 
        modal: true,
        closable: false,
   //     bodyStyle: 'padding:10px;',
        items: [
            processBar
        ],
        setProcess: function(state) {
            if (state == null) {
                this.hide();
                return;
            }
            processBar.updateProgress(state.finish / state.total, 
                state.msg + " | " + state.finish + "/" + state.total);
            this.show();
        }
    });
    LoadingWindow.superclass.constructor.call(this, c);
}

Ext.extend(LoadingWindow, Ext.Window, {
});

LoadingWindow.setProcess = function(state) {
    this.instance = this.instance || new LoadingWindow({});
    this.instance.setProcess(state);
}
