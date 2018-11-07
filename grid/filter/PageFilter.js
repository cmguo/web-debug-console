/*
 * Ext JS Library 2.3.0
 * Copyright(c) 2006-2009, Ext JS, LLC.
 * licensing@extjs.com
 * 
 * http://extjs.com/license
 */

Ext.grid.filter.PageFilter = Ext.extend(Ext.grid.filter.Filter, {
	
    start: 0, 
    end: -1, 
    step: 100, 
    count: 0,

	init: function(grid) {
        if (grid === undefined) {
            if (this.step > 0) {
                this.end = this.step;
            }
            this.active = this.isActivatable();
        } else if (grid instanceof Ext.grid.GridPanel) {
            this.grid = grid;
            this.parter = new Ext.grid.filter.PageFilter();
            grid.filters.addFilter(this.parter);
            grid.store.on("beforeload", this.reset.bind(this));
            grid.on("filterupdate", this.reset.bind(this));
            grid.on("bodyscroll", this.onScroll.bind(this));
        }
	},
	
	fireUpdate: function() {
		this.setActive(this.isActivatable());
		this.fireEvent("update", this);
	},
	
	isActivatable: function() {
		return this.start > 0 || this.end > this.start;
	},

    more: function(value) {
        if (this.count == this.end)
            this.setValue({end: this.end + this.step});
    },
	
	setValue: function(value) {
        if (value.start !== undefined)
            this.start = value.start;
        if (value.end !== undefined)
            this.end = value.end;
        this.fireUpdate();
	},
	
	getValue: function() {
		return {
            start: this.start,
            end: this.end
        };
	},
	
	serialize: function() {
		var args = {type: 'range', value: this.getValue()};
		this.fireEvent('serialize', args, this);
		return args;
	},
	
    reset: function(filters, filter) {
        this.count = 0;
        if (this.parter)
            this.parter.reset();
        if (filter === this)
            return;
        if (this.step > 0) {
            this.start = 0;
            this.end = this.step;
        }
    },

	validateRecord: function(record) {
        if (!this.parter) {
            ++this.count;
            return true;
        }
        this.count = this.parter.count;
        return this.count >= this.start && (this.end < 0 || this.count < this.end);
	},

    onScroll: function(scrollLeft, scrollTop) {
        console.log("onScroll: " + scrollLeft + " " + scrollTop);
        var view = this.grid.view;
        var vTop = view.el.getTop();
        var vBottom = view.el.getBottom();
        var lTop = Ext.fly(view.getRow(this.grid.store.getCount() - 1)).getTop();
        if (lTop < vBottom + (vBottom - vTop) / 2)
            this.more();
    }
});
