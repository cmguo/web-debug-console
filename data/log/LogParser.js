// data/log/LogParser.js

var LogParser = function(c) {
    c = Ext.apply(c || {}, {
        minLines: 10, 
        minScore: 4
    });
    this.parseState = {
        lines: [], 
        parsers: Object.keys(LogParser.parsers).map(function(p) {
            return {
                parser: LogParser.parsers[p], 
                score: 0
            };
        })
    };
    Ext.apply(this, c);
}

LogParser.prototype = {
    parse: function(line) {
        this.parseState.lines = this.parseState.lines.concat(line);
        var max = { score: 0 };
        this.parseState.parsers.forEach(function (o) {
            if (o.parser.prototype.pattern.test(line))
                o.score += 1;
            if (o.score > max.score)
                max = o;
        });
        if (this.parseState.lines.length >= this.minLines 
                && max.score >= this.minScore) {
            var parser = new max.parser();
            this.parse = function(line) {
                var item = parser.parse(line);
                item.line = line;
                return item;
            };
            return this.parseState.lines.map(this.parse);
        } else if (this.parseState.lines.length > 20) {
            this.parse = function() { return [] };
            throw "can't detech log format";
        }
        return [];
    }
};

LogParser.parsers = {};

LogParser.register = function(name, clazz) {
    LogParser.parsers[name] = clazz;
}

var JsonLogParser = Ext.extend(LogParser, {
    parse: function(line) {
        var item = Ext.decode(line);
        item.time = new Date(item.time);
        item.prio = item.prio || item.priority;
        return item;
    }, 
    pattern: /^\{.*\}$/
});

LogParser.register("json", JsonLogParser);
