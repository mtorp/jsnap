(function(options) {
    var window = this;

    // hijack some of the native functions
    var _String = String;
    var _Object = Object;
    var _ArrayProto = Array.prototype;
    var hasOwnProperty = Object.prototype.hasOwnProperty;
    var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;
    var getOwnPropertyNames = Object.getOwnPropertyNames;
    var preventExtensions = Object.preventExtensions;
    var seal = Object.seal;
    var freeze = Object.freeze;
    var defineProperty = Object.defineProperty;
    var bind = Function.prototype.bind;
    var apply = Function.prototype.apply;
    var call = Function.prototype.call;

    defineHiddenProperty(Function.prototype, "__jsnapHiddenProp__apply", apply);
    defineHiddenProperty(Function.prototype, "__jsnapHiddenProp__call", call);

    function hasPrty(obj, x) {
        return hasOwnProperty.__jsnapHiddenProp__call(obj,x);
    }

    var indexOf = Array.prototype.indexOf;
    var splice = Array.prototype.splice;
    var join = Array.prototype.join;
    var push = Array.prototype.push;

    var _bind = Function.prototype.bind;

    function defineHiddenProperty(obj, prop, val) {
        if (defineProperty.__jsnapHiddenProp__call) {
            defineProperty.__jsnapHiddenProp__call(_Object, obj, prop,
                {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: val
                });
        } else {
            defineProperty.call(_Object, obj, prop,
                {
                    enumerable: false,
                    configurable: false,
                    writable: false,
                    value: val
                });
        }
    }

    function toArray(x) {
        return Array.prototype.slice.__jsnapHiddenProp__call(x, 0);
    }

    // ensure synchronous logging in node.js
    if (options.runtime === 'node') {
        var _fs = require('fs')
        console.log = function(msg) {
            var buf = new Buffer(String(msg) + '\n', 'utf8')
            _fs.writeSync(process.stdout.fd, buf, 0, buf.length, process.stdout.pos)
        }
    }

    var _log = console.log
    defineHiddenProperty(window, "__jsnapHiddenProp__print", function(x) {
        _log.__jsnapHiddenProp__call(console, x)
    })

    if (options.silent) {
        console.log = function() {}
    }

    if (_bind) {
        // Only redefine Function.prototype.bind if already existed
        Function.prototype.bind = function() {
            var f = _bind.apply(this, arguments);
            defineHiddenProperty(f, "__jsnapHiddenProp__fun", {type:'bind', target:this, arguments:toArray(arguments)})
            return f;
        }
    }

    // hide the injected properties (anything starting with __jsnapHiddenProp__)
    Object.getOwnPropertyNames = function(o) {
        var array = getOwnPropertyNames.__jsnapHiddenProp__call(_Object,o);
        return array.filter(function (x) {
            return x.substring(0,'__jsnapHiddenProp__'.length) !== "__jsnapHiddenProp__";
        });
    }

    defineHiddenProperty(Function.prototype, "__jsnapHiddenProp__initFunction", function(env, id, name) {
        if (name) {
            var newEnv = {__jsnapHiddenProp__env: env};
            newEnv[name] = this;
            env = newEnv;
        }
        defineHiddenProperty(this, "__jsnapHiddenProp__env", env);
        defineHiddenProperty(this, "__jsnapHiddenProp__fun", {type:'user', id:id});
        return this;
    });

    defineHiddenProperty(Object.prototype, "__jsnapHiddenProp__initObject", function(env,ids) {
        var obj = this;
        var names = getOwnPropertyNames.__jsnapHiddenProp__call(_Object, obj);
        var idIdx = 0;
        for (var k=0; k<names.length; k++) {
            var name = names[k];
            var desc = getOwnPropertyDescriptor.__jsnapHiddenProp__call(_Object, obj, name); //getOwnPropertyDescriptor.call(obj, name);
            if (desc.get) {
                defineHiddenProperty(desc.get, "__jsnapHiddenProp__env", env)
                defineHiddenProperty(desc.get, "__jsnapHiddenProp__fun", {type:'user', id:ids[idIdx++]})
            }
            if (desc.set) {
                defineHiddenProperty(desc.set, "__jsnapHiddenProp__env", env)
                defineHiddenProperty(desc.set, "__jsnapHiddenProp__fun", {type:'user', id:ids[idIdx++]})
            }
        }
        return this;
    });

    defineHiddenProperty(window, "__jsnapHiddenProp__id", function(x) {
        return x;
    });

    Function.prototype.apply = function (that, args) {
        var func = this;
        args = args || [];
        return window.__jsnapHiddenProp__recordArguments.__jsnapHiddenProp__call(that, func, args, false);
    };

    Function.prototype.call = function () {
        var func = this;
        var args = toArray(arguments);
        var that = args[0] || window;
        args = args.slice(1, args.length);
        return window.__jsnapHiddenProp__recordArguments.__jsnapHiddenProp__call(that, func, args, false);
    };

    // Thanks: http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible#answer-8843181
    function newCall(Cls, args) {
        return new (bind.__jsnapHiddenProp__apply(Cls, [null].concat(args)));
    }

    defineHiddenProperty(window, "__jsnapHiddenProp__recordArguments_method", function(prop, arguments, isNew, callsite) {
        var obj = this;
        return window.__jsnapHiddenProp__recordArguments.__jsnapHiddenProp__call(obj, obj[prop], arguments, isNew, callsite)
    });

    defineHiddenProperty(window, "__jsnapHiddenProp__recordArguments", function(func, arguments, isNew, callsite) {
        var type = func.__jsnapHiddenProp__fun.type;
        var result;
        if (type != "user" && type != "bind") {
            if (isNew) {
                return newCall(func, arguments);
            } else {
                return func.__jsnapHiddenProp__apply(this, arguments);
            }
        }
        var records;
        if (hasPrty(func, "__jsnapHiddenProp__recordedCalls")) {
            records = func.__jsnapHiddenProp__recordedCalls;
        } else {
            records = [];
            defineHiddenProperty(func, "__jsnapHiddenProp__recordedCalls", records);
        }

        if (typeof isNew === "undefined") {
            throw new Error("isNew is undefined");
        }


        var recordedCall = {
            args: arguments,
            this: this,
            isNew: isNew
        };
        records.push(recordedCall);
        if (isNew) {
            result = newCall(func, arguments);
        } else {
            result = func.__jsnapHiddenProp__apply(this, arguments);
        }
        recordedCall.return = result;

        if (callsiteToClosures) {
            if (callsiteToClosures[callsite]) {
                callsiteToClosures[callsite].push(func);
            } else {
                callsiteToClosures[callsite] = [func];
            }
        }

        return result;
    });

    if (options.recordCalls) {
        var callsiteToClosures = window.__jsnap__callsitesToClosures = [];
    }

    defineHiddenProperty(window, "__jsnapHiddenProp__env0", window);

    function instrumentNatives(names) {
        names.forEach(function(name) {
            var tokens = name.split('.')
            var obj = window;
            var m;
            for (var i=0; i<tokens.length; i++) {
                var token = tokens[i]
                if (m = token.match(/require\('(.*)'\)/)) {
                    obj = require(m[1])
                }
                else if (m = token.match(/(.*)#(get|set)/)) {
                    var desc = Object.getOwnPropertyDescriptor(obj, m[1])
                    obj = m[2] === 'get' ? desc.get : desc.set;
                }
                else if (token === '__proto__') {
                    obj = Object.getPrototypeOf(obj)
                }
                else {
                    obj = obj[token]
                }
                if (!obj)
                    return;
            }
            if (!obj) {
                // _log.__jsnapHiddenProp__call(console, "Invalid native: " + name)
                return;
            }
            if (obj.hasOwnProperty("__jsnapHiddenProp__fun")) {
                // _log.__jsnapHiddenProp__call(console, "Duplicate native: " + name + " vs " + obj.__jsnapHiddenProp__fun.id)
                return;
            }
            defineHiddenProperty(obj, "__jsnapHiddenProp__fun", {type:'native', id:name})
        })
    }

    instrumentNatives(options.natives)


})(%ARGS%);
