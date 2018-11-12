// panels/command.js

var CommandTree = function(c) {
    CommandTree.superclass.constructor.call(this, Ext.apply({
        root: new Ext.tree.AsyncTreeNode({
            id: "console/mCommands", 
            text: "All Commands"
        }),
        loader: new StatusLoader(Ext.apply({
            baseParams: {
                splitvalue: ""
            },
            createNode: function(attr) {
                if (attr.value.indexOf('@') < 0)
                    attr.text = attr.value;
                attr.path = attr.id;
                attr.id += "/mSubCommands";
                return StatusLoader.prototype.createNode.call(this, attr);
            }
        }, c)),
    }, c));
};

Ext.extend(CommandTree, Ext.tree.TreePanel, {
    width: 200,
    autoScroll: true,
    rootVisible: false,
});

var ArgListPanel = function(c) {
    ArgListPanel.superclass.constructor.call(this, Ext.apply({
        store: new Ext.data.JsonStore({
            data: [], 
            fields: [ "name", "has_arg", "value", "desc" ]
        }),
        cm: new Ext.grid.ColumnModel({
            columns: [{
                id: 'name', 
                header : '名称', 
                width: 100
            }, {
                id: 'has_arg', 
                header : '形式', 
                width: 100,
                renderer: function(v) {
                    return this[v];
                }.bind({
                    0: '选项-无参数', 
                    1: '选项-必填参数',
                    2: '选项-可选参数',
                    ".": '参数-必填',
                    "?": '参数-可选',
                    "+": '参数-必填列表',
                    "*": '参数-可选列表'
                })
            }, {
                id: 'value', 
                header : '数值', 
                dataIndex: 'value', 
                width: 200
            }, {
                id: 'desc', 
                header: '描述', 
                width: 500
            }], 
            isCellEditable: function(colIndex) {
                return colIndex == 2;
            },
            getCellEditor: function(colIndex, rowIndex) {
                var record = this.store.getAt(rowIndex);
                if (record.data.has_arg == 0) {
                    return new Ext.Editor(
                        new Ext.form.Checkbox({width: 200}));
                } else {
                    return new Ext.Editor(
                        new Ext.form.TextField({width: 200}));
                }
            }.bind(this)
        }),
        buttons: [{
            text: '添加参数',
            scope: this, 
            handler: this.addParam
        }, {
            text: '删除参数',
            scope: this, 
            handler: this.delParam
        }]
    }, c));
};

Ext.extend(ArgListPanel, Ext.grid.EditorGridPanel, {
    title: '选项及参数',
    clicksToEdit: 'auto',
    addParam: function() {
        var cell = this.getSelectionModel().getSelectedCell();
        if (!cell) return;
        var record = this.store.getAt(cell[0]);
        if (record.data.has_arg == 2 || record.data.has_arg == '+' 
            || record.data.has_arg == '*') {
                this.store.insert(cell[0] + 1, record.copy(Ext.id(null, "copy-arg-")));
            } else {
                Ext.MessageBox.alert("错误", "只能添加列表形式的参数");
            }
    },
    delParam: function() {
        var cell = this.getSelectionModel().getSelectedCell();
        if (!cell) return;
        var record = this.store.getAt(cell[0]);
        if (typeof record.id == 'string' && record.id.startsWith("copy-arg-"))
            this.store.removeAt(cell[0]);
        else
            Ext.MessageBox.alert("错误", "只能删除先前添加的参数");
    },
    makeParams: function() {
        var params = {};
        var args = [];
        var error = false;
        var skip_arg = false;
        this.store.each(function(record) {
            var v2 = record.data.value;
            if (!v2) {
                if (record.data.has_arg == '.' || record.data.has_arg == '+') {
                    error = error || "必须填写参数'" + record.data.name + "'";
                }
                return;
            }
            if (typeof record.data.has_arg == "string") {
                if (skip_arg) {
                    error = error || "必须填写中间参数'" + skip_arg.name + "'";
                }
                args.push(v2);
                return;
            }
            var v = params[record.data.name];
            if (record.data.has_arg == 0) {
                v2 = '';
            }
            if (typeof v == "undefined") {
                v = v2;
            } else if (typeof v == "string") {
                v = [v, v2];
            } else {
                v.put(v2);
            }
            params[record.data.name] = v;
        });
        if (error) {
            Ext.MessageBox.alert("错误", error);
            return null;
        }
        if (args.length)
            params._ = args;
        return params;
    }
});

var DetailPanel = function(c) {
    var argList = new ArgListPanel({
        region: 'center',
    });
    var panel = this;
    DetailPanel.superclass.constructor.call(this, Ext.apply({
        argList: argList,
        items: [{
            xtype: 'label', 
            itemId: 'desc',
            region: 'north',
            height: 60,
            text: '命令说明'
        }, argList, {
            xtype: 'textarea',
            itemId: 'output',
            region: 'south',
            height: 160,
            border: true,
            emptyText: '结果输出'
        }], 
        bbar: [{
            xtype: 'textfield', 
            width: 800,
            emptyText: '直接输入命令', 
            listeners: {
                specialkey: function(f, e){
                    if (e.getKey() == e.ENTER) {
                        panel.execute(this.getValue());
                    }
                }
            }
        }],
        buttons: [{
            text: '执行', 
            scope: this, 
            handler: this.execute
        }]
    }, c));
};

Ext.extend(DetailPanel, Ext.Panel, {
    layout: 'border',
    execute: function(line) {
        var name;
        var params;
        if (typeof line == "string") {
            var tokens = line.split(" ");
            name = tokens[0];
            params = {
                "_": tokens.slice(1)
            }
        } else {
            var cmd = this.cmd;
            var idPath = cmd.id.split("/");
            name = idPath[3];
            for (var i = 5; i < idPath.length; i += 2) {
                name += "." + idPath[i];
            }
            params = this.argList.makeParams();
        }
        var url = this.datasrc.url + name;
        Ext.Ajax.request({
            url: url,
            method: 'GET',
            params: params,
            scope: this,
            success: function(response) {
                var output = this.getComponent('output');
                output.setValue(response.responseText);
                var url = "/cmguo/work/WallpaperPlayer/WallpaperPlayerService/res/drawable-xhdpi/ic_launcher.png";
                output.getEl().set({
                    style: 'background-repeat: no-repeat; background-position: center; background-image: url(' + url + ');'
                });
            }
        });
    },
    setCmd: function(cmd) {
        this.cmd = cmd;
        var desc = this.getComponent('desc');
        desc.setText(cmd.Usage);
        var opts = cmd.LongOptions || [];
        var args = (cmd.Arguments || []).map(function (v) {
            var t = v.charAt(v.length - 1);
            if (t == '*' || t == '?' || t == "+") {
                v = v.substring(0, v.length - 1);
            } else {
                t = '.';
            }
            return { name: v, has_arg: t };
        });
        this.argList.store.loadData(opts.concat(args), false);
    }
});

var CommandPanel = function(c) {
    var tree = new CommandTree(Ext.apply({
        region: 'west'
    }, c));
    var detail = new DetailPanel(Ext.apply({
        region: 'center'
    }, c));
    tree.on("click", function(node) {
        var url = this.loader.url.replace("jsontree", "jsondump");
        Ext.Ajax.request({
            url: url, 
            method: 'GET',
            params: {
                x: '',
                o: '',
                d: 0, 
                _: node.attributes.path
            }, 
            success: function(response) {
                var cmd = eval("("+response.responseText+")");
                cmd.id = node.attributes.path;
                detail.setCmd(cmd);
            }
        });
    });
    CommandPanel.superclass.constructor.call(this, Ext.apply({
        items: [ tree, detail ]
    }, c));
};

Ext.extend(CommandPanel, Ext.Panel, {
    title: '命令',
    layout: 'border',
});
