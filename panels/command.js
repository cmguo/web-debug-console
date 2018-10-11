// command.js

var commandLoader = new Ext.tree.TreeLoader({
    url: "none", 
    requestMethod: "GET",
    baseParams: {
        splitvalue: ""
    },
    createNode: function(attr) {
        //attr.iconCls = attr.type;
        return Ext.tree.TreeLoader.prototype.createNode.call(this, attr);
    }
});
commandLoader.getParams = function(node){
    var buf = [], bp = this.baseParams;
    for(var key in bp){
        if(typeof bp[key] != "function"){
            buf.push(encodeURIComponent(key), "=", encodeURIComponent(bp[key]), "&");
        }
    }
    return buf.join("");
}
commandLoader.on("beforeload", function(treeLoader, node) {
    if (this.url == "none")
        return false;
    if (node.attributes.id == "/") {
        this.baseParams._ = "console/mCommands";
    } else {
        this.baseParams._ = node.attributes.id + "/mSubCommands";
    }
    return true;
}, commandLoader);

var commandTree = new Ext.tree.TreePanel({
    id: 'command-tree', 
    title: '命令', 
    region: "west",
    width: 200,
    autoScroll: true,
    rootVisible: false,
    root: new Ext.tree.AsyncTreeNode({
        id: "/", 
        text: "All Commands"
    }),
    loader: commandLoader,
    set_url: function(url) {
        url = url + "jsontree";
        if ( this.loader.url != url) {
            this.loader.url = url;
            this.getRootNode().reload();
        }
    },
    listeners : {
        beforecollapsenode: function(node) {
            while(node.firstChild){
                node.removeChild(node.firstChild);
            }
            node.loaded = false;
        },
    }
});


var argList = new Ext.grid.EditorGridPanel({
    region: 'center', 
    title: '选项及参数',
    clicksToEdit: 'auto',
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
            var record = argList.store.getAt(rowIndex);
            if (record.data.has_arg == 0) {
                return new Ext.Editor(
                    new Ext.form.Checkbox({width: 200}));
            } else {
                return new Ext.Editor(
                    new Ext.form.TextField({width: 200}));
            }
        }
    }),
    buttons: [{
        text: '添加参数',
        handler: function() {
            var cell = argList.getSelectionModel().getSelectedCell();
            if (!cell) return;
            var record = argList.store.getAt(cell[0]);
            if (record.data.has_arg == 2 || record.data.has_arg == '+' 
                || record.data.has_arg == '*') {
                    argList.store.insert(cell[0] + 1, record.copy(Ext.id(null, "copy-arg-")));
                } else {
                    Ext.MessageBox.alert("错误", "只能添加列表形式的参数");
                }
        }
    }, {
        text: '删除参数',
        handler: function() {
            var cell = argList.getSelectionModel().getSelectedCell();
            if (!cell) return;
            var record = argList.store.getAt(cell[0]);
            if (record.id && record.id.startsWith("copy-arg-"))
                argList.store.removeAt(cell[0]);
            else
                Ext.MessageBox.alert("错误", "只能删除先前添加的参数");
        }
    }]
});

var detailPanel = new Ext.Panel({
    region: 'center',
    layout: 'border',
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
    buttons: [{
        text: '执行', 
        handler: function() {
            var cmd = detailPanel.cmd;
            var idPath = cmd.id.split("/");
            var name = idPath[3];
            for (var i = 5; i < idPath.length; i += 2)
                name += "." + idPath[i];
            var params = {};
            var args = [];
            var error = false;
            var skip_arg = false;
            argList.store.each(function(record) {
                var v2 = record.data.value;
                if (!v2) {
                    if (record.data.has_arg == '.' || record.data.has_arg == '+')
                        error = error || "必须填写参数'" + record.data.name + "'";
                    return;
                }
                if (typeof record.data.has_arg == "string") {
                    if (skip_arg)
                        error = error || "必须填写中间参数'" + skip_arg.name + "'";
                    args.push(v2);
                    return;
                }
                var v = params[record.data.name];
                if (record.data.has_arg == 0)
                    v2 = '';
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
                return;
            }
            params._ = args;
            Ext.Ajax.request({
                url: commandLoader.url.replace("jsontree", name), 
                method: 'GET',
                params: params,
                scope: detailPanel,
                success: function(response) {
                    var output = this.getComponent('output');
                    output.setValue(response.responseText);
                    var url = "/cmguo/work/WallpaperPlayer/WallpaperPlayerService/res/drawable-xhdpi/ic_launcher.png";
                    output.getEl().set({
                        style: 'background-repeat: no-repeat; background-position: center; background-image: url(' + url + ');'
                    });
                }
            });
        }
    }],
    setCmd: function(cmd) {
        this.cmd = cmd;
        var desc = this.getComponent('desc');
        desc.setText(cmd.Usage);
        var opts = cmd.LongOptions || [];
        var args = (cmd.Arguments || []).map(function (v) {
            var t = v.charAt(v.length - 1);
            if (t == '*' || t == '?' || t == "+")
                v = v.substring(0, v.length - 1);
            else
                t = '.';
            return { name: v, has_arg: t };
        });
        argList.store.loadData(opts.concat(args), false);
    }
});

commandTree.on("click", function(node) {
    Ext.Ajax.request({
        url: commandLoader.url.replace("jsontree", "jsondump"), 
        method: 'GET',
        params: {
            x: '',
            o: '',
            d: 2, 
            _: node.id
        }, 
        success: function(response) {
            var cmd = eval("("+response.responseText+")");
            cmd.id = node.id;
            detailPanel.setCmd(cmd);
        }
    });
});

var commandPanel = new Ext.Panel({
    id: 'command-panel', 
    title: '命令',
    layout: 'border',
    items: [
        commandTree, 
        detailPanel
    ],
    set_url: function(url) {
        commandTree.set_url(url);
    }
});

