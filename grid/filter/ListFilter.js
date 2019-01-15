/*
 * Ext JS Library 2.3.0
 * Copyright(c) 2006-2009, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.grid.filter.ListFilter = Ext.extend(Ext.grid.filter.Filter, {
	labelField:  'text',
	loadingText: 'Loading...',
	loadOnShow:  true,
	value:       [],
	loaded:      false,
	phpMode:     false,
	
	init: function(){
		this.menu.add('<span class="loading-indicator">' + this.loadingText + '</span>');
		
		if(this.store && this.loadOnShow) {
		  this.menu.on('show', this.onMenuLoad, this);
		} else if(this.options) {
			var options = [];
			for(var i=0, len=this.options.length; i<len; i++) {
				var value = this.options[i];
				switch(Ext.type(value)) {
					case 'array':  
            options.push(value);
            break;
					case 'object':
            options.push([value.id, value[this.labelField]]);
            break;
					case 'string':
            options.push([value, value]);
            break;
				}
			}
			
			this.store = new Ext.data.Store({
				reader: new Ext.data.ArrayReader({id: 0}, ['id', this.labelField])
			});
			this.options = options;
			this.menu.on('show', this.onMenuLoad, this);
		}
    
		this.store.on('load', this.onLoad, this);
		this.bindShowAdapter();
	},
	
	/**
	 * Lists will initially show a 'loading' item while the data is retrieved from the store. In some cases the
	 * loaded data will result in a list that goes off the screen to the right (as placement calculations were done
	 * with the loading item). This adaptor will allow show to be called with no arguments to show with the previous
	 * arguments and thusly recalculate the width and potentially hang the menu from the left.
	 * 
	 */
	bindShowAdapter: function() {
		var oShow = this.menu.show;
		var lastArgs = null;
		this.menu.show = function() {
			if(arguments.length == 0) {
				oShow.apply(this, lastArgs);
			} else {
				lastArgs = arguments;
				oShow.apply(this, arguments);
			}
		};
	},
	
	onMenuLoad: function() {
		if(!this.loaded) {
			if(this.options) {
				this.store.loadData(this.options);
      } else {
				this.store.load();
      }
		}
	},
	
	onLoad: function(store, records) {
		var visible = this.menu.isVisible();
		this.menu.hide(false);
		
		this.menu.removeAll();

		if (this.groupCache) {
			Object.keys(this.groupCache).forEach(function(k) {
				this.addCacheGroup(k, this.groupCache[k]);
			}, this);
		}

		if (this.menuItems) {
			this.menu.add.apply(this.menu, this.menuItems);
		}
		
		var gid = this.single ? Ext.id() : null;
		var groupItem = null;
		for(var i=0, len=records.length; i<len; i++) {
			var item = new Ext.menu.CheckItem({
				text: records[i].get(this.labelField), 
				group: gid, 
				checked: this.value.indexOf(records[i].id) > -1,
				hideOnClick: false
     		});
			item.itemId = records[i].id;
			item.on('checkchange', this.checkChange, this);
			if (store.groupField) {
				var group = records[i].get(store.groupField);
				groupItem = this.addItemToGroup(groupItem, item, group);
			} else {
				this.menu.add(item);
			}
		} // for

		this.addItemToGroup(groupItem, records.length);
		
		this.setActive(this.isActivatable());
		this.loaded = true;
		
		if (visible) {
			this.menu.show(); //Adaptor will re-invoke with previous arguments
    	}
	},

	addItemToGroup: function(groupItem, item, group) {
		if (!groupItem || groupItem.group != group) {
			if (groupItem) {
				if ((typeof item == 'number') && groupItem.items.length == item) {
					this.menu.add.apply(this.menu, groupItem.items);
				} else if (groupItem.items.length > 1) {
					groupItem.menu = new Ext.menu.Menu({
						items: groupItem.items
					});
					delete groupItem.group;
					groupItem = new Ext.menu.CheckItem(groupItem);
					groupItem.menu.items.each(function(t) {
						t.ownerItem = groupItem;
					});
					groupItem.on('checkchange', this.checkChange, this);
					this.menu.add(groupItem);
				} else {
					this.menu.add(groupItem.items[0]);
				}
			}
			if (typeof item == 'number') return null;
			groupItem = {
				text: '' + group,
				group: group,
				hideOnClick: false,
				items: []
			};
		}
		groupItem.items.push(item);
		return groupItem;
	},
	
	checkChange: function(item, checked) {
		if (checked) {
			var ownerItem = item.ownerItem;
			if (ownerItem != null) {
				ownerItem.setChecked(true, true);
			}
		}
		var value = [];
		this.visitItem(function(item) {
			if (item.menu) {
				return item.checked;
			}
			if (item.checked) {
				value.push(item.itemId);
			}
		});
		this.value = value;
		
		this.setActive(this.isActivatable());
		this.fireEvent("update", this);
	},

	visitItem: function(visitor, items) {
		items = items || this.menu.items;
		items.each(function(item) {
			if (item.menu) {
				if (visitor(item)) {
					this.visitItem(visitor, item.menu.items);
				}
			} else {
				visitor(item);
			}
		}, this);
	},
	
	isActivatable: function() {
		return this.value.length > 0;
	},
	
	setValue: function(value) {
		var value = this.value = [].concat(value);

		if(this.loaded) {
			visitItem(function(item) {
				item.setChecked(value.indexOf(item.itemId) >= 0, true);
          	});
    	}
		
		this.fireEvent("update", this);
	},
	
	getValue: function() {
		return this.value;
	},

	getNonCachedValue: function() {
		var value = [];
		this.visitItem(function(item) {
			if (item.cacheGroup) {
				return false;
			}
			if (item.menu) {
				return item.checked;
			}
			if (item.checked) {
				value.push(item.itemId);
			}
		});
		return value;
	},

	addCacheGroup: function(k, values) {
		var groupItem = new Ext.menu.CheckItem({
			text: '{' + k + '}', 
			menu: new Ext.menu.Menu({
				items: values.map(function(v) {
					var item = new Ext.menu.CheckItem({
						text: String(v),
						checked: true
					});
					item.itemId = v;
					return item;
				})
			})
		});
		groupItem.cacheGroup = values;
		groupItem.menu.items.each(function(t) {
			t.ownerItem = groupItem;
		});
		groupItem.on('checkchange', this.checkChange, this);
		this.menu.insert(0, groupItem);
	},
	
	serialize: function() {
    var args = {type: 'list', value: this.phpMode ? this.value.join(',') : this.value};
    this.fireEvent('serialize', args, this);
		return args;
	},
	
	validateRecord: function(record) {
		return this.getValue().indexOf(record.get(this.dataIndex)) > -1;
	}
});