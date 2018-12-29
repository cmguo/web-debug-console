// panels/config.js

var jiraOptions = eval("("+window.localStorage.config_jira+")");

var jiraSave = function() {
    window.localStorage.config_jira = Ext.util.JSON.encode(jiraOptions);
}

var JiraServerRecord = Ext.data.Record.create([
    'host', 
    'user', 
    'pass', 
]);

var jiraTree = new Ext.tree.TreePanel({
    region: 'west', 
    rootVisible: false,
    width: 300, 
    root: new Ext.tree.AsyncTreeNode({
        id: '#', 
        text: '',
        children: Object.keys(jiraOptions).filter(function(v) {
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
    }),
    buttons: [{
        text: '删除', 
        handler: function() {
            var node = jiraTree.getSelectionModel().getSelectedNode();
            if (node) {
                node.remove();
                if (jiraOptions.default == node.id) {
                    delete jiraOptions.default;
                }
                delete jiraOptions[node.id];
                jiraSave();
            }
        }
    }, {
        text: '增加', 
        handler: function() {
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
                jiraTree.getRootNode().appendChild(node);
                jiraTree.getSelectionModel().select(node);
            });
        }
    }]
});

var jiraForm = new Ext.form.FormPanel({
    border: false,
    heigth: 100,
    defaults: {
        width: 300
    },
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
        handler: function() {
            jiraForm.form.updateRecord(jiraForm.form.record);
            var data = jiraForm.form.record.data;
            var auth = 'Basic ' + btoa(data.user + ':' + data.pass);
            data.value.headers.Authorization = auth;
            jiraSave();
        }
    }, {
        text: '默认', 
        handler: function() {
            jiraOptions.default = jiraForm.form.record.data.host;
            jiraSave();
        }
    }]
});

var configPanel = new Ext.TabPanel({
    title: '配置',
    activeItem: 0, 
    items: [{
        title: 'JIRA',
        layout: 'border',
        items: [
            jiraTree, {
                layout: 'fit', 
                region: 'center', 
                border: false,
                items: [jiraForm]
        }]
    }]
});

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

