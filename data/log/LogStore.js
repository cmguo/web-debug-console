// data/log/LogStore.js

var LogStore = Ext.extend(DataStore, {
    createReader: function(c) {
        return new LogReader(c);
    },
});

LogStore.tagFilterGroups = eval("("+window.localStorage.config_log_filter_tag+")") || {}

LogStore.saveTagFilterGroups = function() {
    window.localStorage.config_log_filter_tag = 
        Ext.util.JSON.encode(this.tagFilterGroups);
}

LogStore.addTagFilterGroup = function(name) {
    this.tagFilterGroups[name] = [];
    this.saveTagFilterGroups();
}

LogStore.removeTagFilterGroup = function(name) {
    delete this.tagFilterGroups[name];
    this.saveTagFilterGroups();
}

LogStore.addTagFilter = function(group, tag) {
    if (this.tagFilterGroups[group].indexOf(tag) >= 0) {
        return false;
    }
    this.tagFilterGroups[group].push(tag);
    this.saveTagFilterGroups();
    return true;
}

LogStore.removeTagFilter = function(group, tag) {
    var index = this.tagFilterGroups[group].indexOf(tag);
    if (index < 0) {
        return false;
    }
    this.tagFilterGroups[group].splice(index, 1);
    this.saveTagFilterGroups();
    return true;
}
