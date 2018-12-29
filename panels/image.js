// panel/image.js

var ImagePanel = function(c) {
    ImagePanel.superclass.constructor.call(this, Ext.apply({
        proxy: DataStore.createProxy(c), 
        items: [{
            id: 'imageview',
            width: 'auto',
            heigth: 'auto',
            html: '<img style="background-image: url(img/brick.png);"/>'
        }]
    }, c));
}

Ext.extend(ImagePanel, Ext.Panel, {
    border: false,
    layout: 'fit', 
    listeners: {
        activate: function() {
            this.load();
        }
    }, 
    load: function() {
        var img = this.getComponent("imageview");
        img = img.el.query("img")[0];
        this.proxy.loadAsUrl(function(url) {
            img.src = url;
        });
    }
});
