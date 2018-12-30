// panel/video.js

var VideoPanel = function(c) {
    VideoPanel.superclass.constructor.call(this, Ext.apply({
        proxy: DataStore.createProxy(c), 
        items: [{
            id: 'videoview',
            width: 'auto',
            heigth: 'auto',
            html: '<video/>'
        }]
    }, c));
}

Ext.extend(VideoPanel, Ext.Panel, {
    border: false,
    layout: 'fit', 
    autoScroll: true,
    listeners: {
        activate: function() {
            this.load();
        }
    }, 
    load: function() {
        var video = this.getComponent("videoview");
        video = video.el.query("video")[0];
        this.proxy.loadAsUrl(function(url) {
            video.src = url;
            video.play();
        });
    }
});
