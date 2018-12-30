// panels/jira.js

var jiraOptions = eval("("+window.localStorage.config_jira+")") || {};

var jiraSave = function() {
    window.localStorage.config_jira = Ext.util.JSON.encode(jiraOptions);
}

var Jira = function(c) {
    this.url = c.url;
    this.opts = jiraOptions[c.host];
}

Ext.extend(Jira, Object, {
    load: function(callback) {
        Ext.Ajax.request(Ext.apply({
            url: this.url, 
            disableCaching: false, 
            scope: this, 
            success: function(response) {
                var json = response.responseText;
                this.data = eval("("+json+")");
                callback(this);
            }
        }, this.opts));
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
    }
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

var JiraServerRecord = Ext.data.Record.create([
    'host', 
    'user', 
    'pass', 
]);

var JiraTree = function(c) {
    ConfigPanel.superclass.constructor.call(this, Ext.apply({
        root: new Ext.tree.AsyncTreeNode({
            id: '#', 
            text: '',
            children: this.load()
        }),
        buttons: [{
            text: '删除', 
            scope: this, 
            handler: this.delete
        }, {
            text: '增加', 
            scope: this, 
            handler: this.add
        }]
    }, c));
};

Ext.extend(JiraTree, Ext.tree.TreePanel, {
    rootVisible: false,
    load: function() {
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
    },
    add: function() {
        InputWindow.input("输入JIRA服务器域名", function(k) {
            var s = {
                headers: {}
            };
            jiraOptions[k] = s;
            if (!jiraOptions.default) {
                jiraOptions.default = k;
            }
            var node = new Ext.tree.TreeNode({
                id: k, 
                text: k, 
                leaf: true, 
                data: {
                    host: k, 
                    user: '',
                    pass: '',
                    value: s
                }
            });
            this.getRootNode().appendChild(node);
            this.getSelectionModel().select(node);
        });
    },
    delete: function() {
        var node = this.getSelectionModel().getSelectedNode();
        if (node) {
            node.remove();
            if (jiraOptions.default == node.id) {
                delete jiraOptions.default;
            }
            delete jiraOptions[node.id];
            jiraSave();
        }
    }
});

var JiraForm = function(c) {
    JiraForm.superclass.constructor.call(this, Ext.apply({
        items: [{
            name: 'host',
            fieldLabel: '服务器',
            xtype: 'textfield'
        }, {
            name: 'user',
            fieldLabel: '用户名',
            xtype: 'textfield'
        }, {
            name: 'pass',
            fieldLabel: '密码',
            xtype: 'textfield',
            inputType: 'password'
        }], 
        buttons: [{
            text: '保存', 
            scope: this,
            handler: this.save
        }, {
            text: '默认', 
            scope: this,
            handler: this.default
        }]
    }, c));
};

Ext.extend(JiraForm, Ext.form.FormPanel, {
    border: false,
    defaults: {
        width: 300
    },
    save: function() {
        this.form.updateRecord(this.form.record);
        var data = this.form.record.data;
        var auth = 'Basic ' + btoa(data.user + ':' + data.pass);
        data.value.headers.Authorization = auth;
        jiraSave();
    }, 
    default: function() {
        jiraOptions.default = this.form.record.data.host;
        jiraSave();
    }
});

var JiraConfig = function(c) {
    var jiraTree = new JiraTree({
        region: 'west', 
        width: 300
    });
    var jiraForm = new JiraForm({});
    jiraTree.getSelectionModel().on('selectionchange', function(sel, node) {
        if (!node) {
            jiraForm.form.reset();
            jiraForm.form.record = null;
            return;
        }
        var record = new JiraServerRecord(node.attributes.data);
        jiraForm.form.record = record;
        jiraForm.form.loadRecord(record);
    });
    ConfigPanel.superclass.constructor.call(this, Ext.apply({
        items: [
            jiraTree, {
                layout: 'fit', 
                region: 'center', 
                items: [jiraForm]
        }]
    }, c));
};

Ext.extend(JiraConfig, Ext.Panel, {
    title: 'JIRA',
    layout: 'border'
});

var JiraPanel = function(c) {
    JiraPanel.superclass.constructor.call(this, Ext.apply({
    }, c));
}

Ext.extend(JiraPanel, Ext.Panel, {
    title: 'JIRA',
    layout: 'border'
});