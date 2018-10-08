var menu_def = {
    id          : 'root',
    children    : [], 
    leaf        : false
};

menu_def.add = function(item) {
    var menu_item = this;
    if (typeof(item.path) != 'undefined') {
        var item1 = this.find(item.path);
        if (item1 != null) {
            menu_item = item1;
        }
    }
    if (item.children)
        item.get_panel = menu_def.get_panel;
    menu_item.children.push(item);
};

menu_def.find = function(path) {
    var arr = path.split('/');
    var menu_item = this;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == '') {
            continue;
        }
        for (var j = 0; j < menu_item.children.length; j++) {
            if (menu_item.children[j].id == arr[i]) {
                break;
            }
        }
        if (j == menu_item.children.length) {
            break;
        }
        menu_item = menu_item.children[j];
    }
    if (i != arr.length) {
        return null;
    }
    return menu_item;
};

menu_def.get_panel = function (id) {
    for (var j = 0; j < this.children.length; j++) {
        if (this.children[j].leaf && this.children[j].id == id) {
            if (this.children[j].panel instanceof Function)
                this.children[j].panel = this.children[j].panel(); 
            return this.children[j].panel;
        } else if (this.children[j].get_panel) {
            panel = this.children[j].get_panel(id);
            if (panel)
                return panel;
        }
    }
    return null;
};

menu_def.get_panels = function () {
    var panels = [];
    var get_panels = function (menu_item) {
        for (var j = 0; j < menu_item.children.length; j++) {
            if (menu_item.children[j].leaf) {
                if (menu_item.children[j].panel instanceof Function)
                    menu_item.children[j].panel = menu_item.children[j].panel(); 
                panels.push(menu_item.children[j].panel);
            } else {
                get_panels(menu_item.children[j]);
            }
        }
    }
    get_panels(this);
    return panels;
};

