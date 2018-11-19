// panels/screen.js

var ScreenPanel = function(c) {
    ScreenPanel.superclass.constructor.call(this, Ext.apply({
        items: [{
            id: 'imageview',
            width: 'auto',
            heigth: 'auto',
            html: '<img style="background-image: url(img/brick.png); width: 720px; height: 405px;">'
        }],     
        tbar: [{
            xtype: "button", 
            text: "截图", 
            scope: this, 
            handler: function() {
                this.reload();
            }
        }, {
            xtype: "button", 
            text: "视频", 
        }]
    }, c));
};

Ext.extend(ScreenPanel, Ext.Panel, {
    title: '屏幕',
    layout:'card',
    iconCls: "screen-tab",
    activeItem: 0,
    listeners: {
        activate: function() {
            this.reload();
        }
    }, 
    reload: function() {
        var img = this.getComponent("imageview");
        img = img.el.query("img")[0];
        img.src = this.datasrc.url + "screenshot?c=&_dc=" + new Date().getTime();
    }
});

