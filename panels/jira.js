// panels/jira.js

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
            children: Jira.loadConfig()
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
    add: function() {
        InputWindow.input("输入JIRA服务器域名", function(k) {
            var node = new Ext.tree.TreeNode(Jira.createServer(k));
            this.getRootNode().appendChild(node);
            this.getSelectionModel().select(node);
        }.bind(this));
    },
    delete: function() {
        var node = this.getSelectionModel().getSelectedNode();
        if (node) {
            node.remove();
            Jira.removeServer(node.id);
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
        Jira.updateServer(this.form.record);
    }, 
    default: function() {
        Jira.defaultServer(this.form.record.data.host);
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
    JiraConfig.superclass.constructor.call(this, Ext.apply({
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