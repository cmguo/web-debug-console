// data/Jira.js

var jiraOptions = eval("("+window.localStorage.config_jira+")") || {};

var JiraServerRecord = Ext.data.Record.create([
    'host', 
    'user', 
    'pass', 
]);

var Jira = function() {
}

Jira.saveConfig = function() {
    window.localStorage.config_jira = Ext.util.JSON.encode(jiraOptions);
}

Jira.loadConfig = function() {
    return Object.keys(jiraOptions).filter(function(v) {
        return v != 'default';
    }).map(function(k) {
        var v = jiraOptions[k];
        var auth = atob(v.headers.Authorization.substring(6)).split2(/:/g, 2);
        return {
            id: k, 
            text: k, 
            leaf: true, 
            data: {
                host: k, 
                user: auth[0],
                pass: auth[1],
                value: v
            }
        }
    })
};

Jira.createServer = function(host) {
    var s = {
        headers: {}
    };
    jiraOptions[host] = s;
    if (!jiraOptions.default) {
        jiraOptions.default = host;
    }
    Jira.saveConfig();
    return {
        id: host,
        text: host, 
        leaf: true, 
        data: {
            host: host, 
            user: '',
            pass: '',
            value: s
        }
    };
}

Jira.removeServer = function(host) {
    if (jiraOptions.default == host) {
        delete jiraOptions.default;
    }
    delete jiraOptions[host];
    Jira.saveConfig();
}

Jira.updateServer = function(svr) {
    var data = svr.data;
    var auth = 'Basic ' + btoa(data.user + ':' + data.pass);
    data.value.headers.Authorization = auth;
    Jira.saveConfig();
}

Jira.defaultServer = function(host) {
    jiraOptions.default = host;
    Jira.saveConfig();
}

Ext.extend(Jira, Object, {
    open: function(src, callback) {
        this.url = src.url;
        this.id = src.text;
        this.opts = jiraOptions[src.host];
            Ext.Ajax.request(Ext.apply({
            url: this.url, 
            disableCaching: false, 
            scope: this, 
            success: function(response) {
                var json = response.responseText;
                this.data = eval("("+json+")");
                callback(this, this.getEntries());
            }
        }, this.opts));
    }, 
    getEntries: function() {
        var entries = [{
            text: this.id,
            name: 'JIRA', 
            type: 'jira', 
            jira: this
        }];
        entries = entries.concat(this.getAttachments());
        return entries;
    },
    getSummary: function() {
        return this.data.fields.summary;
    },
    getDetail: function() {
        return this.data.fields;
    },
    getDescription: function() {
        return this.data.fields.description;
    },
    getAttachments: function() {
        var now = new Date();
        var prefix = this.url.substring(0, this.url.indexOf("/", 1));
        return this.data.fields.attachment.map(function(a) {
            var url = new URL(a.content);
            url.pathname = prefix + url.pathname;
            var type = panels.getType(a.filename);
            return {
                text: a.filename + "(" + dateDiff(a.created, now) + ")", 
                name: a.filename,
                type: type, 
                url: url.toString(), 
                opts: this.opts
            };
        }.bind(this));
    },
    getComments: function() {
        var now = new Date();
        return this.data.fields.comment.comments.map(function(c) {
            var updated = new Date(c.updated);
            var n = c.body.indexOf('\n');
            if (n < 0 || n > 50) n = 50;
            return {
                author: c.author.displayName, 
                updated: updated.format('m-d H:i') + "(" + dateDiff(updated, now) + ")",
                body: c.body, 
                subject: c.body.substring(0, n)
            };
        }.bind(this));
    },
});

Jira.format = function(id) {
    var host = jiraOptions.default;
    var path = id;
    if (id.indexOf("://") > 0) { 
        var url = new URL(id);
        host = url.hostname;
        id = url.pathname.split("/").slice(-1)[0];
        path = "/" + host + url.pathname;
    } else {
        path = "/" + host + "/rest/api/2/issue/" + id;
    }
    var type = panels.getType(id);
    if (id.indexOf(".") < 0) {
        type = "[jira]";
        path = "/" + host + "/rest/api/2/issue/" + id;
    }
    return node = {
        text: id, 
        type: type,
        host: host, 
        url: path
    };
}
