var ipAddress = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
Ext.apply(Ext.form.VTypes, {
    'ip' : function (v) {
        var matches = ipAddress.exec(v);
        if (matches) {
            for (var i = 1; i <= 4; i++) {
                if (matches[i] && !(parseInt(matches[i], 10) < 256 && parseInt(matches[i], 10) >= 0)) {
                    return false;
                }
            }
            return true;
        }
        return false;
    },
    'ipText' : 'Invalid ip address'
});

var ip_ntop = function (v) {
    var ip = parseInt(v);
    var s = '';
    for (var i = 0; i < 4; i++) {
        if (i != 0) {
           s = '.' + s;
        }
        s = ip % 256 + s;
        ip = Math.floor(ip / 256);
    }
    return s; 
};

var ip_pton = function (v) {
    var nums = v.split('.');
    var ip = 0;
    for (var i = 0; i < 4; i++) {
        ip = ip * 256 + parseInt(nums[i]);
    }
    return ip; 
};

Ext.form.DateField.prototype.format = 'Y-m-d H:i:s';

var format_date = function (v) {
    if (typeof v == 'undefined')
        return 'undefined';
    return v.format('Y-m-d');
};

var format_date_time = function (v) {
    if (typeof v == 'undefined')
        return 'undefined';
    return v.format('Y-m-d H:i:s');
};

var IpField = Ext.extend(Ext.form.TextField, {
    constructor : function(config) {
        config.vtype = 'ip';
        IpField.superclass.constructor.apply(this, arguments);
    },
    setValue    : function(v) {
        IpField.superclass.setValue.call(this, ip_ntop(v));
    }, 
    getValue    : function() {
        var v = IpField.superclass.getValue.call(this);
        return ip_pton(v);
    }
});

Ext.reg('ipfield', IpField);

var PasswordField = Ext.extend(Ext.form.TextField, {
    constructor : function(config) {
        config.inputType = 'password';
        IpField.superclass.constructor.apply(this, arguments);
    }
});

Ext.reg('passwordfield', PasswordField);


function version_ntov(v)
{
    var version = parseInt(v);
    return "" + (version>>24).toString() + "." + ((version & 0x00FF0000)>>16).toString() + "." + (version & 0x0000FFFF).toString();
};

function version_vton(v)
{
    var nums = v.split('.');
    return parseInt(nums[0]<<24) + parseInt(nums[1]<<16) + parseInt(nums[2]);
};


var VersionField = Ext.extend(Ext.form.TextField, {
    constuctor : function(config) {
        VersionField.superclass.constuctor.apply(this, arguments);
    },
    setValue : function(v) {
        VersionField.superclass.setValue.call(this, version_ntov(v));
    },
    getValue : function() {
        var v = VersionField.superclass.getValue.call(this);
        return version_vton(v);
    }
});

Ext.reg('versionfield', VersionField);

var CenterLayout = Ext.extend(Ext.layout.FitLayout, {
    // private
    setItemSize : function(item, size){
        this.container.addClass('ux-layout-center');
        item.addClass('ux-layout-center-item');
        if(item && size.height > 0){
            if(item.width){
                size.width = item.width;
            }
            if(item.height){
                size.height = item.height;
            }
            item.setSize(size);
        }
    }
});

Ext.Container.LAYOUTS['center'] = CenterLayout;

var convert_record = function (Record, data) {
    var f = Record.prototype.fields, fi = f.items, fl = f.length;
    for(var j = 0; j < fl; j++) {
        f = fi[j];
        if (typeof data[f.name] != "undefined") {
            data[f.name] = f.convert(data[f.name], data);
        }
    }
};

var dateDiff = function() {
    var minute = 60000;
    var hour = minute * 60;
    var day = hour * 24;
    var week = day * 7;
    var month = day * 30;
    var year = month * 365;
    return function(date, now) {
        date = new Date(date);
        now = now || new Date();
        var diff = now - date;
        if (diff >= year)
            return Math.floor(diff / year) + "年前";
        else if (diff > month)
            return Math.floor(diff / month) + "月前";
        else if (diff > week)
            return Math.floor(diff / week) + "周前";
        else if (diff > day)
            return Math.floor(diff / day) + "天前";
        else if (diff > hour)
            return Math.floor(diff / hour) + "小时前";
        else if (diff > minute)
            return Math.floor(diff / minute) + "分钟前";
        else
            return "刚刚";
    }
}();
