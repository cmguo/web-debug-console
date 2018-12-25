// panels/screen.js

var ScreenPanel = function(c) {
    ScreenPanel.superclass.constructor.call(this, Ext.apply({
        items: [{
            id      : 'blank-panel',
            layout  : 'fit'
        },{
            id: 'imageview',
            width: 'auto',
            heigth: 'auto',
            html: '<img style="background-image: url(img/brick.png); width: 720px; height: 405px;"/>'
        },{
            id: 'videoview',
            width: 'auto',
            heigth: 'auto',
            html: '<video autoplay="autoplay" width="720" height="405" style="background-image: url(img/brick.png); ">'
            + '<source src="/ppbox2/movies/m3u8/cntv/cntv.m3u8" type="application/x-mpegURL" />'
            + '</video>'
        }],     
        tbar: [{
            xtype: "button", 
            text: "截图", 
            scope: this, 
            handler: function() {
                this.showImage();
            }
        }, {
            xtype: "button", 
            text: "视频", 
            scope: this, 
            handler: function() {
                this.showVideo();
            }
        }, {
            xtype: "button", 
            text: "停止", 
            scope: this, 
            handler: function() {
                this.stopVideo();
            }
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
    showImage: function() {
        this.layout.setActiveItem('imageview');
        this.loadImage();
    }, 
    showVideo: function() {
        this.layout.setActiveItem('videoview');
        this.loadVideo(true);
    }, 
    reload: function() {
        var item = this.layout.activeItem;
        if (item.id == 'imageview') {
            this.loadImage();
         } else if (item.id == 'videoview') {
            this.loadVideo();
         }
    }, 
    loadImage: function() {
        var img = this.getComponent("imageview");
        img = img.el.query("img")[0];
        img.src = this.datasrc.url + "screenshot?c=&_dc=" + new Date().getTime();
    },
    loadVideo: function(reload) {
        var video = this.getComponent("videoview");
        video = video.el.query("video")[0];
        if (reload || video.readyState < 2) {
            var url = this.datasrc.url + "screencap?f=m3u8&_dc=" + new Date().getTime();
            //video.src = '/ppbox2/movies/ts/yu.ts';
            videojs(video, {}, function () {
                console.log("videojs " + arguments);
                this.src({type: "application/x-mpegURL", src: url});
            });
        }
    }, 
    stopVideo: function(reload) {
        var video = this.getComponent("videoview");
        video = video.el.query("video")[0];
        var url = this.datasrc.url + "screencap?f=m3u8&i=0";
        videojs(video, {"fluid": true   }, function () {
            this.reset();
            this.src("");
        });
        Ext.Ajax.request({url: url});
    }
});

videojs.log.level('debug');
