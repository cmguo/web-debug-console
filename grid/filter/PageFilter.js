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
    total: 0,
    items: [],

	init: function(grid) {
        if (grid === undefined) {
            if (this.step > 0) {
                this.end = this.step;
            }
            this.active = this.isActivatable();
        } else if (grid instanceof Ext.grid.GridPanel) {
            this.grid = grid;
            var parter = new Ext.grid.filter.Filter({
                active: true, 
                validateRecord: function(record) {
                    return this.validateRecord2(record);
                }.bind(this)
            });
            grid.filters.addFilter(parter);
            grid.store.on("beforeload", this.reset.bind(this));
            grid.on("filterupdate", this.reset.bind(this));
            grid.on("bodyscroll", this.onScroll.bind(this));
            grid.getView().on("refresh", this.scrollView.bind(this));
        }
	},
	
	fireUpdate: function() {
		this.setActive(this.isActivatable());
		this.fireEvent("update", this);
	},
	
	isActivatable: function() {
		return this.start > 0 || this.end > this.start;
	},

    more: function(down) {
        if (down && this.items.length == this.end) {
            this.setValue({end: this.end + this.step});
        } else if (!down && this.start > 0) {
            this.setValue({start: this.start > this.step ? this.start - this.step : 0});
        }
    },
	
	setValue: function(value) {
        if (value.start !== undefined) {
            this.start = value.start;
            this.moreFirst = 0;
        }
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
        this.total = 0;
        this.lasts = this.items;
        this.items = [];
        if (filter === this) {
            return;
        }
        var first = this.firstVisible();
        this.moreFirst = this.lasts[this.start + first];
        this.lasts = [];
        if (this.step > 0) {
            this.start = 0;
            this.moreStart = this.start;
            this.end = this.start + this.step;
        }
    },

    validateRecord2: function(record) {
        this.items.push(this.total - 1);
        if (this.total <= this.moreFirst) {
            ++this.start;
            this.moreStart = this.start;
            ++this.end;
            return false;
        }
        return this.items.length > this.start;
    }, 

	validateRecord: function(record) {
        if (this.lasts.length > 0) {
            if (this.total++ < this.lasts[0]) {
                return false;
            }
            this.lasts.shift();
        } else {
            ++this.total;
        }
        return this.end < 0 || this.items.length < this.end;
    },
    
    validateRecord2: function(record) {
        this.items.push(this.total - 1);
        if (this.total <= this.moreFirst) {
            ++this.start;
            this.moreStart = this.start;
            ++this.end;
            return false;
        }
        return this.items.length > this.start;
    }, 

    scroll: 0,

    scrollView: function() {
        var offset;
        if (this.moreStart > this.start) {
            offset = this.moreStart - this.start;
            this.moreStart = this.start;
        } else if (this.moreFirst) {
            var first = this.moreFirst;
            this.moreFirst = 0;
            offset = this.binarySearch(this.items, function(v) {
                return v >= first;
            }) - this.start;
        }
        if (typeof offset == 'number') {
            var view = this.grid.view;
            var lTop = Ext.fly(view.getRow(0)).getTop();
            var rTop = Ext.fly(view.getRow(offset)).getTop();
            view.scroller.dom.scrollTop = rTop - lTop;
        }
    },  

    onScroll: function(scrollLeft, scrollTop) {
        var count = this.grid.store.getCount();
        if (count == 0)
            return;
        var view = this.grid.view;
        var height = view.el.getHeight();
        var top = Ext.fly(view.getRow(0)).dom.offsetTop;
        var bottom = Ext.fly(view.getRow(count - 1)).dom.offsetTop + 
            Ext.fly(view.getRow(count - 1)).dom.offsetHeight;
        var height1 = height / 2;
        var height2 = bottom - top - height * 1.5;
        if (this.scroll < height2 && height2 < scrollTop) {
            this.more(true);
        } else if (scrollTop < height1 && height1 < this.scroll || scrollTop == 0) {
            this.more(false);
        }
        this.scroll = scrollTop;
    }, 

    firstVisible: function() {
        var count = this.grid.store.getCount();
        if (count == 0)
            return;
        var view = this.grid.view;
        var height = view.el.getHeight();
        var top = Ext.fly(view.getRow(0)).dom.offsetTop;
        var bottom = Ext.fly(view.getRow(count - 1)).dom.offsetTop;
        var first = 0;
        var last = count - 1;
        var vf = Ext.fly(view.getRow(first)).dom;
        while (vf.offsetTop + vf.offsetHeight < this.scroll || vf.offsetTop > this.scroll) {
            if (vf.offsetTop > 0) {
                var diff = Math.floor((vf.offsetTop + vf.offsetHeight - this.scroll) 
                    * (last - first) / (bottom - vf.offsetTop));
                if (diff == 0) diff = 1;
                first = first > diff ? first - diff : 0;
                vf = Ext.fly(view.getRow(first)).dom;
            } else {
                var diff = Math.floor((this.scroll - vf.offsetTop) 
                    * (last - first) / (bottom - vf.offsetTop));
                if (diff == 0) diff = 1;
                first += diff;
                if (first > last) first = last;
                vf = Ext.fly(view.getRow(first)).dom;
            }
        }
        return first;
    },

    binarySearch: function(array, pred) {
        let lo = -1, hi = array.length;
        while (1 + lo < hi) {
            const mi = lo + ((hi - lo) >> 1);
            if (pred(array[mi])) {
                hi = mi;
            } else {
                lo = mi;
            }
        }
        return hi;
    }

});
