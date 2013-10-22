(function () {
/**
 * almond 0.2.6 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

/**
 * @license
 * Lo-Dash 2.1.0 (Custom Build) lodash.com/license | Underscore.js 1.5.2 underscorejs.org/LICENSE
 * Build: `lodash exports="amd" include="defer,each,isObject,isArray" -m -o lodash.custom.js`
 */
;(function(){function t(){return h.pop()||{a:"",b:null,c:"",k:null,configurable:!1,enumerable:!1,"false":!1,d:"",e:"",v:null,g:"","null":!1,number:null,z:null,push:null,h:null,string:null,i:"","true":!1,undefined:!1,j:!1,writable:!1}}function n(){}function e(t){var n=t.k;n&&e(n),t.b=t.k=t.object=t.number=t.string=null,h.length<v&&h.push(t)}function r(){}function o(t,n,e){if(typeof t!="function")return m;if(typeof n=="undefined")return t;var r=t.__bindData__||U.funcNames&&!t.name;if(typeof r=="undefined"){var o=E&&N.call(t);
U.funcNames||!o||j.test(o)||(r=!0),(U.funcNames||!r)&&(r=!U.funcDecomp||E.test(o),X(t,r))}if(true!==r&&r&&1&r[1])return t;switch(e){case 1:return function(e){return t.call(n,e)};case 2:return function(e,r){return t.call(n,e,r)};case 3:return function(e,r,o){return t.call(n,e,r,o)};case 4:return function(e,r,o,u){return t.call(n,e,r,o,u)}}return y(t,n)}function u(t,n,e,r,o,i){var l=1&n,s=2&n,p=4&n,y=8&n,g=16&n,m=32&n,b=t;if(!s&&!c(t))throw new TypeError;g&&!e.length&&(n&=-17,g=e=!1),m&&!r.length&&(n&=-33,m=r=!1);
var h=t&&t.__bindData__;if(h)return!l||1&h[1]||(h[4]=o),!l&&1&h[1]&&(n|=8),!p||4&h[1]||(h[5]=i),g&&R.apply(h[2]||(h[2]=[]),e),m&&R.apply(h[3]||(h[3]=[]),r),h[1]|=n,u.apply(null,h);if(!l||s||p||m||!(U.fastBind||J&&g))v=function(){var c=arguments,h=l?o:this;return(p||g||m)&&(c=H.call(c),g&&$.apply(c,e),m&&R.apply(c,r),p&&c.length<i)?(n|=16,u(t,y?n:-4&n,c,null,o,i)):(s&&(t=h[b]),this instanceof v?(h=a(t.prototype),c=t.apply(h,c),f(c)?c:h):t.apply(h,c))};else{if(g){var d=[o];R.apply(d,e)}var v=g?J.apply(t,d):J.call(t,o)
}return X(v,H.call(arguments)),v}function i(){var n=t();n.h=w,n.b=n.c=n.g=n.i="",n.e="t",n.j=!0;for(var r,u=0;r=arguments[u];u++)for(var i in r)n[i]=r[i];u=n.a,n.d=/^[^,]+/.exec(u)[0],r=Function,u="return function("+u+"){",i="var n,t="+n.d+",E="+n.e+";if(!t)return E;"+n.i+";",n.b?(i+="var u=t.length;n=-1;if("+n.b+"){",U.unindexedChars&&(i+="if(s(t)){t=t.split('')}"),i+="while(++n<u){"+n.g+";}}else{"):U.nonEnumArgs&&(i+="var u=t.length;n=-1;if(u&&p(t)){while(++n<u){n+='';"+n.g+";}}else{"),U.enumPrototypes&&(i+="var G=typeof t=='function';"),U.enumErrorProps&&(i+="var F=t===k||t instanceof Error;");
var a=[];if(U.enumPrototypes&&a.push('!(G&&n=="prototype")'),U.enumErrorProps&&a.push('!(F&&(n=="message"||n=="name"))'),n.j&&n.f)i+="var C=-1,D=B[typeof t]&&v(t),u=D?D.length:0;while(++C<u){n=D[C];",a.length&&(i+="if("+a.join("&&")+"){"),i+=n.g+";",a.length&&(i+="}"),i+="}";else if(i+="for(n in t){",n.j&&a.push("m.call(t, n)"),a.length&&(i+="if("+a.join("&&")+"){"),i+=n.g+";",a.length&&(i+="}"),i+="}",U.nonEnumShadows){for(i+="if(t!==A){var i=t.constructor,r=t===(i&&i.prototype),f=t===J?I:t===k?j:L.call(t),x=y[f];",k=0;7>k;k++)i+="n='"+n.h[k]+"';if((!(r&&x[n])&&m.call(t,n))",n.j||(i+="||(!x[n]&&t[n]!==A[n])"),i+="){"+n.g+"}";
i+="}"}return(n.b||U.nonEnumArgs)&&(i+="}"),i+=n.c+";return E",r=r("d,j,k,m,o,p,q,s,v,A,B,y,I,J,L",u+i+"}"),e(n),r(o,x,C,L,d,l,Y,s,n.f,I,S,Q,A,T,K)}function a(t){return f(t)?q(t):{}}function l(t){return t&&typeof t=="object"&&typeof t.length=="number"&&K.call(t)==O||!1}function c(t){return typeof t=="function"}function f(t){return!(!t||!S[typeof t])}function s(t){return typeof t=="string"||K.call(t)==A}function p(t,n,e){if(n&&typeof e=="undefined"&&Y(t)){e=-1;for(var r=t.length;++e<r&&false!==n(t[e],e,t););}else tn(t,n,e);
return t}function y(t,n){return 2<arguments.length?u(t,17,H.call(arguments,2),null,n):u(t,1,null,null,n)}function g(t){if(!c(t))throw new TypeError;var n=H.call(arguments,1);return setTimeout(function(){t.apply(b,n)},1)}function m(t){return t}var b,h=[],d={},v=40,j=/^function[ \n\r\t]+\w/,E=/\bthis\b/,w="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" "),O="[object Arguments]",x="[object Error]",A="[object String]",S={"boolean":!1,"function":!0,object:!0,number:!1,string:!1,undefined:!1},_=S[typeof window]&&window||this,P=S[typeof exports]&&exports&&!exports.nodeType&&exports,D=S[typeof module]&&module&&!module.nodeType&&module,P=D&&D.exports===P&&P,F=[],C=Error.prototype,I=Object.prototype,T=String.prototype,B=RegExp("^"+(I.valueOf+"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/valueOf|for [^\]]+/g,".+?")+"$"),N=Function.prototype.toString,L=I.hasOwnProperty,R=F.push,z=I.propertyIsEnumerable,K=I.toString,$=F.unshift,G=function(){try{var t={},n=B.test(n=Object.defineProperty)&&n,e=n(t,t,t)&&n
}catch(r){}return e}(),J=B.test(J=K.bind)&&J,q=B.test(q=Object.create)&&q,V=B.test(V=Array.isArray)&&V,W=B.test(W=Object.keys)&&W,H=F.slice,D=B.test(_.attachEvent),M=J&&!/\n|true/.test(J+D),Q={};Q["[object Array]"]=Q["[object Date]"]=Q["[object Number]"]={constructor:!0,toLocaleString:!0,toString:!0,valueOf:!0},Q["[object Boolean]"]=Q[A]={constructor:!0,toString:!0,valueOf:!0},Q[x]=Q["[object Function]"]=Q["[object RegExp]"]={constructor:!0,toString:!0},Q["[object Object]"]={constructor:!0},function(){for(var t=w.length;t--;){var n,e=w[t];
for(n in Q)L.call(Q,n)&&!L.call(Q[n],e)&&(Q[n][e]=!1)}}();var U=r.support={};!function(){function t(){this.x=1}var n={0:1,length:1},e=[];t.prototype={valueOf:1};for(var r in new t)e.push(r);for(r in arguments);U.argsClass=K.call(arguments)==O,U.argsObject=arguments.constructor==Object&&!(arguments instanceof Array),U.enumErrorProps=z.call(C,"message")||z.call(C,"name"),U.enumPrototypes=z.call(t,"prototype"),U.fastBind=J&&!M,U.funcDecomp=!B.test(_.l)&&E.test(function(){return this}),U.funcNames=typeof Function.name=="string",U.nonEnumArgs=0!=r,U.nonEnumShadows=!/valueOf/.test(e),U.spliceObjects=(F.splice.call(n,0,1),!n[0]),U.unindexedChars="xx"!="x"[0]+Object("x")[0]
}(1),q||(a=function(t){if(f(t)){n.prototype=t;var e=new n;n.prototype=null}return e||{}});var X=G?function(n,r){var o=t();o.value=r,G(n,"__bindData__",o),e(o)}:n;U.argsClass||(l=function(t){return t&&typeof t=="object"&&typeof t.length=="number"&&L.call(t,"callee")||!1});var Y=V||function(t){return t&&typeof t=="object"&&typeof t.length=="number"&&"[object Array]"==K.call(t)||!1},Z=i({a:"z",e:"[]",i:"if(!(B[typeof z]))return E",g:"E.push(n)"}),V=W?function(t){return f(t)?U.enumPrototypes&&typeof t=="function"||U.nonEnumArgs&&t.length&&l(t)?Z(t):W(t):[]
}:Z,tn=i({a:"g,e,K",i:"e=e&&typeof K=='undefined'?e:d(e,K,3)",b:"typeof u=='number'",v:V,g:"if(e(t[n],n,g)===false)return E"});c(/x/)&&(c=function(t){return typeof t=="function"&&"[object Function]"==K.call(t)}),M&&P&&typeof setImmediate=="function"&&(g=function(t){if(!c(t))throw new TypeError;return setImmediate.apply(_,arguments)}),r.bind=y,r.defer=g,r.forEach=p,r.keys=V,r.each=p,r.identity=m,r.isArguments=l,r.isArray=Y,r.isFunction=c,r.isObject=f,r.isString=s,r.VERSION="2.1.0",typeof define=="function"&&typeof define.amd=="object"&&define.amd&& define('lodash',[],function(){return r
})}).call(this);
/*global setImmediate: false, setTimeout: false, console: false */
(function () {

    var async = {};

    // global on the server, window in the browser
    var root, previous_async;

    root = this;
    if (root != null) {
      previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        var called = false;
        return function() {
            if (called) throw new Error("Callback was already called.");
            called = true;
            fn.apply(root, arguments);
        }
    }

    //// cross-browser compatiblity functions ////

    var _each = function (arr, iterator) {
        if (arr.forEach) {
            return arr.forEach(iterator);
        }
        for (var i = 0; i < arr.length; i += 1) {
            iterator(arr[i], i, arr);
        }
    };

    var _map = function (arr, iterator) {
        if (arr.map) {
            return arr.map(iterator);
        }
        var results = [];
        _each(arr, function (x, i, a) {
            results.push(iterator(x, i, a));
        });
        return results;
    };

    var _reduce = function (arr, iterator, memo) {
        if (arr.reduce) {
            return arr.reduce(iterator, memo);
        }
        _each(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    };

    var _keys = function (obj) {
        if (Object.keys) {
            return Object.keys(obj);
        }
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////
    if (typeof process === 'undefined' || !(process.nextTick)) {
        if (typeof setImmediate === 'function') {
            async.nextTick = function (fn) {
                // not a direct alias for IE10 compatibility
                setImmediate(fn);
            };
            async.setImmediate = async.nextTick;
        }
        else {
            async.nextTick = function (fn) {
                setTimeout(fn, 0);
            };
            async.setImmediate = async.nextTick;
        }
    }
    else {
        async.nextTick = process.nextTick;
        if (typeof setImmediate !== 'undefined') {
            async.setImmediate = setImmediate;
        }
        else {
            async.setImmediate = async.nextTick;
        }
    }

    async.each = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        _each(arr, function (x) {
            iterator(x, only_once(function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                }
            }));
        });
    };
    async.forEach = async.each;

    async.eachSeries = function (arr, iterator, callback) {
        callback = callback || function () {};
        if (!arr.length) {
            return callback();
        }
        var completed = 0;
        var iterate = function () {
            iterator(arr[completed], function (err) {
                if (err) {
                    callback(err);
                    callback = function () {};
                }
                else {
                    completed += 1;
                    if (completed >= arr.length) {
                        callback(null);
                    }
                    else {
                        iterate();
                    }
                }
            });
        };
        iterate();
    };
    async.forEachSeries = async.eachSeries;

    async.eachLimit = function (arr, limit, iterator, callback) {
        var fn = _eachLimit(limit);
        fn.apply(null, [arr, iterator, callback]);
    };
    async.forEachLimit = async.eachLimit;

    var _eachLimit = function (limit) {

        return function (arr, iterator, callback) {
            callback = callback || function () {};
            if (!arr.length || limit <= 0) {
                return callback();
            }
            var completed = 0;
            var started = 0;
            var running = 0;

            (function replenish () {
                if (completed >= arr.length) {
                    return callback();
                }

                while (running < limit && started < arr.length) {
                    started += 1;
                    running += 1;
                    iterator(arr[started - 1], function (err) {
                        if (err) {
                            callback(err);
                            callback = function () {};
                        }
                        else {
                            completed += 1;
                            running -= 1;
                            if (completed >= arr.length) {
                                callback();
                            }
                            else {
                                replenish();
                            }
                        }
                    });
                }
            })();
        };
    };


    var doParallel = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.each].concat(args));
        };
    };
    var doParallelLimit = function(limit, fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [_eachLimit(limit)].concat(args));
        };
    };
    var doSeries = function (fn) {
        return function () {
            var args = Array.prototype.slice.call(arguments);
            return fn.apply(null, [async.eachSeries].concat(args));
        };
    };


    var _asyncMap = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (err, v) {
                results[x.index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    };
    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = function (arr, limit, iterator, callback) {
        return _mapLimit(limit)(arr, iterator, callback);
    };

    var _mapLimit = function(limit) {
        return doParallelLimit(limit, _asyncMap);
    };

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachSeries(arr, function (x, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };
    // inject alias
    async.inject = async.reduce;
    // foldl alias
    async.foldl = async.reduce;

    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, function (x) {
            return x;
        }).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };
    // foldr alias
    async.foldr = async.reduceRight;

    var _filter = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.filter = doParallel(_filter);
    async.filterSeries = doSeries(_filter);
    // select alias
    async.select = async.filter;
    async.selectSeries = async.filterSeries;

    var _reject = function (eachfn, arr, iterator, callback) {
        var results = [];
        arr = _map(arr, function (x, i) {
            return {index: i, value: x};
        });
        eachfn(arr, function (x, callback) {
            iterator(x.value, function (v) {
                if (!v) {
                    results.push(x);
                }
                callback();
            });
        }, function (err) {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    };
    async.reject = doParallel(_reject);
    async.rejectSeries = doSeries(_reject);

    var _detect = function (eachfn, arr, iterator, main_callback) {
        eachfn(arr, function (x, callback) {
            iterator(x, function (result) {
                if (result) {
                    main_callback(x);
                    main_callback = function () {};
                }
                else {
                    callback();
                }
            });
        }, function (err) {
            main_callback();
        });
    };
    async.detect = doParallel(_detect);
    async.detectSeries = doSeries(_detect);

    async.some = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (v) {
                    main_callback(true);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(false);
        });
    };
    // any alias
    async.any = async.some;

    async.every = function (arr, iterator, main_callback) {
        async.each(arr, function (x, callback) {
            iterator(x, function (v) {
                if (!v) {
                    main_callback(false);
                    main_callback = function () {};
                }
                callback();
            });
        }, function (err) {
            main_callback(true);
        });
    };
    // all alias
    async.all = async.every;

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                var fn = function (left, right) {
                    var a = left.criteria, b = right.criteria;
                    return a < b ? -1 : a > b ? 1 : 0;
                };
                callback(null, _map(results.sort(fn), function (x) {
                    return x.value;
                }));
            }
        });
    };

    async.auto = function (tasks, callback) {
        callback = callback || function () {};
        var keys = _keys(tasks);
        if (!keys.length) {
            return callback(null);
        }

        var results = {};

        var listeners = [];
        var addListener = function (fn) {
            listeners.unshift(fn);
        };
        var removeListener = function (fn) {
            for (var i = 0; i < listeners.length; i += 1) {
                if (listeners[i] === fn) {
                    listeners.splice(i, 1);
                    return;
                }
            }
        };
        var taskComplete = function () {
            _each(listeners.slice(0), function (fn) {
                fn();
            });
        };

        addListener(function () {
            if (_keys(results).length === keys.length) {
                callback(null, results);
                callback = function () {};
            }
        });

        _each(keys, function (k) {
            var task = (tasks[k] instanceof Function) ? [tasks[k]]: tasks[k];
            var taskCallback = function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _each(_keys(results), function(rkey) {
                        safeResults[rkey] = results[rkey];
                    });
                    safeResults[k] = args;
                    callback(err, safeResults);
                    // stop subsequent errors hitting callback multiple times
                    callback = function () {};
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            };
            var requires = task.slice(0, Math.abs(task.length - 1)) || [];
            var ready = function () {
                return _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            };
            if (ready()) {
                task[task.length - 1](taskCallback, results);
            }
            else {
                var listener = function () {
                    if (ready()) {
                        removeListener(listener);
                        task[task.length - 1](taskCallback, results);
                    }
                };
                addListener(listener);
            }
        });
    };

    async.waterfall = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor !== Array) {
          var err = new Error('First argument to waterfall must be an array of functions');
          return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        var wrapIterator = function (iterator) {
            return function (err) {
                if (err) {
                    callback.apply(null, arguments);
                    callback = function () {};
                }
                else {
                    var args = Array.prototype.slice.call(arguments, 1);
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    async.setImmediate(function () {
                        iterator.apply(null, args);
                    });
                }
            };
        };
        wrapIterator(async.iterator(tasks))();
    };

    var _parallel = function(eachfn, tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            eachfn.map(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            eachfn.each(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.parallel = function (tasks, callback) {
        _parallel({ map: async.map, each: async.each }, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel({ map: _mapLimit(limit), each: _eachLimit(limit) }, tasks, callback);
    };

    async.series = function (tasks, callback) {
        callback = callback || function () {};
        if (tasks.constructor === Array) {
            async.mapSeries(tasks, function (fn, callback) {
                if (fn) {
                    fn(function (err) {
                        var args = Array.prototype.slice.call(arguments, 1);
                        if (args.length <= 1) {
                            args = args[0];
                        }
                        callback.call(null, err, args);
                    });
                }
            }, callback);
        }
        else {
            var results = {};
            async.eachSeries(_keys(tasks), function (k, callback) {
                tasks[k](function (err) {
                    var args = Array.prototype.slice.call(arguments, 1);
                    if (args.length <= 1) {
                        args = args[0];
                    }
                    results[k] = args;
                    callback(err);
                });
            }, function (err) {
                callback(err, results);
            });
        }
    };

    async.iterator = function (tasks) {
        var makeCallback = function (index) {
            var fn = function () {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            };
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        };
        return makeCallback(0);
    };

    async.apply = function (fn) {
        var args = Array.prototype.slice.call(arguments, 1);
        return function () {
            return fn.apply(
                null, args.concat(Array.prototype.slice.call(arguments))
            );
        };
    };

    var _concat = function (eachfn, arr, fn, callback) {
        var r = [];
        eachfn(arr, function (x, cb) {
            fn(x, function (err, y) {
                r = r.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, r);
        });
    };
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        if (test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.whilst(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (test()) {
                async.doWhilst(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.until = function (test, iterator, callback) {
        if (!test()) {
            iterator(function (err) {
                if (err) {
                    return callback(err);
                }
                async.until(test, iterator, callback);
            });
        }
        else {
            callback();
        }
    };

    async.doUntil = function (iterator, test, callback) {
        iterator(function (err) {
            if (err) {
                return callback(err);
            }
            if (!test()) {
                async.doUntil(iterator, test, callback);
            }
            else {
                callback();
            }
        });
    };

    async.queue = function (worker, concurrency) {
        if (concurrency === undefined) {
            concurrency = 1;
        }
        function _insert(q, data, pos, callback) {
          if(data.constructor !== Array) {
              data = [data];
          }
          _each(data, function(task) {
              var item = {
                  data: task,
                  callback: typeof callback === 'function' ? callback : null
              };

              if (pos) {
                q.tasks.unshift(item);
              } else {
                q.tasks.push(item);
              }

              if (q.saturated && q.tasks.length === concurrency) {
                  q.saturated();
              }
              async.setImmediate(q.process);
          });
        }

        var workers = 0;
        var q = {
            tasks: [],
            concurrency: concurrency,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
              _insert(q, data, false, callback);
            },
            unshift: function (data, callback) {
              _insert(q, data, true, callback);
            },
            process: function () {
                if (workers < q.concurrency && q.tasks.length) {
                    var task = q.tasks.shift();
                    if (q.empty && q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    var next = function () {
                        workers -= 1;
                        if (task.callback) {
                            task.callback.apply(task, arguments);
                        }
                        if (q.drain && q.tasks.length + workers === 0) {
                            q.drain();
                        }
                        q.process();
                    };
                    var cb = only_once(next);
                    worker(task.data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            }
        };
        return q;
    };

    async.cargo = function (worker, payload) {
        var working     = false,
            tasks       = [];

        var cargo = {
            tasks: tasks,
            payload: payload,
            saturated: null,
            empty: null,
            drain: null,
            push: function (data, callback) {
                if(data.constructor !== Array) {
                    data = [data];
                }
                _each(data, function(task) {
                    tasks.push({
                        data: task,
                        callback: typeof callback === 'function' ? callback : null
                    });
                    if (cargo.saturated && tasks.length === payload) {
                        cargo.saturated();
                    }
                });
                async.setImmediate(cargo.process);
            },
            process: function process() {
                if (working) return;
                if (tasks.length === 0) {
                    if(cargo.drain) cargo.drain();
                    return;
                }

                var ts = typeof payload === 'number'
                            ? tasks.splice(0, payload)
                            : tasks.splice(0);

                var ds = _map(ts, function (task) {
                    return task.data;
                });

                if(cargo.empty) cargo.empty();
                working = true;
                worker(ds, function () {
                    working = false;

                    var args = arguments;
                    _each(ts, function (data) {
                        if (data.callback) {
                            data.callback.apply(null, args);
                        }
                    });

                    process();
                });
            },
            length: function () {
                return tasks.length;
            },
            running: function () {
                return working;
            }
        };
        return cargo;
    };

    var _console_fn = function (name) {
        return function (fn) {
            var args = Array.prototype.slice.call(arguments, 1);
            fn.apply(null, args.concat([function (err) {
                var args = Array.prototype.slice.call(arguments, 1);
                if (typeof console !== 'undefined') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _each(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            }]));
        };
    };
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        hasher = hasher || function (x) {
            return x;
        };
        var memoized = function () {
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (key in memo) {
                callback.apply(null, memo[key]);
            }
            else if (key in queues) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([function () {
                    memo[key] = arguments;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                      q[i].apply(null, arguments);
                    }
                }]));
            }
        };
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
      return function () {
        return (fn.unmemoized || fn).apply(null, arguments);
      };
    };

    async.times = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.map(counter, iterator, callback);
    };

    async.timesSeries = function (count, iterator, callback) {
        var counter = [];
        for (var i = 0; i < count; i++) {
            counter.push(i);
        }
        return async.mapSeries(counter, iterator, callback);
    };

    async.compose = function (/* functions... */) {
        var fns = Array.prototype.reverse.call(arguments);
        return function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([function () {
                    var err = arguments[0];
                    var nextargs = Array.prototype.slice.call(arguments, 1);
                    cb(err, nextargs);
                }]))
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        };
    };

    var _applyEach = function (eachfn, fns /*args...*/) {
        var go = function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var callback = args.pop();
            return eachfn(fns, function (fn, cb) {
                fn.apply(that, args.concat([cb]));
            },
            callback);
        };
        if (arguments.length > 2) {
            var args = Array.prototype.slice.call(arguments, 2);
            return go.apply(this, args);
        }
        else {
            return go;
        }
    };
    async.applyEach = doParallel(_applyEach);
    async.applyEachSeries = doSeries(_applyEach);

    async.forever = function (fn, callback) {
        function next(err) {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                throw err;
            }
            fn(next);
        }
        next();
    };

    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define('async',[], function () {
            return async;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = async;
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

// Generated by CoffeeScript 1.6.3
define('app',['require','lodash','lodash','async','lodash','async','lodash'],function(require) {
  var Singleton, _LazyLoad;
  _LazyLoad = (function() {
    _LazyLoad.prototype.VERSION = '1.0.2';

    function _LazyLoad(window) {
      var async, get_this, _watch;
      this.init_object_watch();
      this.window = window;
      this.$ = void 0;
      this.lmjxeventTimer = void 0;
      get_this = this;
      _watch = get_this.watchproperty;
      _watch(window, "$", function($) {
        get_this.$ = $;
        return _watch(window, "MathJax", function(_MathJax) {
          return _watch(_MathJax, "Hub", function(MathJax_Hub) {
            return _watch(MathJax_Hub, "config", function(MathJax_Hub_config) {
              return _watch(MathJax_Hub_config, "lazytex2jax", function(lazytex2jax) {
                return _watch(MathJax_Hub_config, "skipStartupTypeset", function(skipStartupTypeset) {
                  var _;
                  _ = require('lodash');
                  if (skipStartupTypeset === true && _.isObject(lazytex2jax)) {
                    get_this['lazytex2jax'] = lazytex2jax;
                    _ = require('lodash');
                    _.defer(function(f, _this) {
                      return f.call(_this);
                    }, get_this.bootstrap, get_this);
                  }
                });
              });
            });
          });
        });
      });
      async = require('async');
      return;
    }

    _LazyLoad.prototype.bootstrap = function() {
      var $, get_this, _, _stopRender;
      _ = require('lodash');
      $ = this.$;
      get_this = this;
      this.stopRender = false;
      _stopRender = this.stopRender;
      $(function() {
        var getTextNodesIn, lazy_watch_queue, _escapeRegExp, _isElementInViewport, _lmjxeventTimer;
        getTextNodesIn = function(el) {
          return $(el).find(":not(script,noscript,img,image,pre,code,audio,input,textarea,button,style,iframe,canvas)").addBack().contents().filter(function() {
            return this.nodeType === 3;
          });
        };
        _escapeRegExp = get_this.escapeRegExp;
        lazy_watch_queue = {};
        _.each(get_this.lazytex2jax, function(delimiter_pack, delimiter_pack_name) {
          if (!_.isArray(delimiter_pack)) {
            return;
          }
          _.each(delimiter_pack, function(delimiter, index) {
            var end_delimiter, re, regex_string, start_delimiter;
            if (!_.isArray(delimiter)) {
              return;
            }
            start_delimiter = _escapeRegExp(delimiter[0]);
            end_delimiter = _escapeRegExp(delimiter[1]);
            regex_string = start_delimiter + '([\\s\\S]*?)' + end_delimiter;
            re = new RegExp(regex_string, 'gi');
            $(getTextNodesIn('body')).each(function() {
              var $text, $this, lazy_element, name, new_text, replacementpattern, stamp;
              $this = $(this);
              $text = $this.text();
              if (re.test($text)) {
                stamp = "lazymathjax-stamp-" + name;
                lazy_element = {};
                lazy_element.start_delimiter = delimiter[0];
                lazy_element.end_delimiter = delimiter[1];
                name = "" + delimiter_pack_name + "-" + index;
                stamp = "lazymathjax-stamp-" + name;
                lazy_element.selector = stamp;
                lazy_watch_queue[name] = lazy_element;
                replacementpattern = "<" + stamp + ">$1</" + stamp + ">";
                re.lastIndex = 0;
                new_text = $text.replace(re, replacementpattern);
                $this.replaceWith(new_text);
              }
            });
          });
        });
        get_this.init_renderMathJax();
        _lmjxeventTimer = get_this.lmjxeventTimer;
        _isElementInViewport = get_this.isElementInViewport;
        $(get_this.window).on("scroll.lmjx resize.lmjx", function() {
          _stopRender = true;
          if (_lmjxeventTimer) {
            clearTimeout(_lmjxeventTimer);
            _lmjxeventTimer = void 0;
          }
          return _lmjxeventTimer = setTimeout(function() {
            _stopRender = false;
            return _.each(lazy_watch_queue, function(delimiter_to_watch, name) {
              var $elems, _renderMathJax;
              $elems = $(delimiter_to_watch.selector);
              if ($elems.size() > 0) {
                _renderMathJax = get_this.renderMathJax;
                return $elems.each(function() {
                  var render_package;
                  if (_stopRender === false && _isElementInViewport($(this).get(0)) === true) {
                    render_package = {
                      elem: $(this).get(0),
                      start_delimiter: delimiter_to_watch.start_delimiter,
                      end_delimiter: delimiter_to_watch.end_delimiter
                    };
                    return _renderMathJax.call(get_this, render_package);
                  }
                });
              }
            });
          }, 1000);
        });
        return $(get_this.window).trigger('scroll.lmjx');
      });
    };

    _LazyLoad.prototype.init_renderMathJax = function() {
      var async, worker, _;
      async = require('async');
      _ = require('lodash');
      if (this.queue == null) {
        worker = function(_work, callback) {
          var _args, _f, _this;
          _f = _work['f'];
          _this = _work['_this'];
          _args = _work['_args'] || [];
          _args.push(callback);
          return _.defer(function(f, _this, _args) {
            return f.apply(_this, _args);
          }, _f, _this, _args);
        };
        this.queue = async.queue(worker, 2);
      }
      if (this.MathJaxQueue == null) {
        this.MathJaxQueue = this.window.MathJax.Hub.queue;
      }
    };

    _LazyLoad.prototype.renderMathJax = function(render_package) {
      var $, render_process, work_package, _queue;
      _queue = this.queue;
      $ = this.$;
      render_process = function(render_package, callback) {
        var $element, $newelement, QUEUE, end_delimiter, some_callback, start_delimiter;
        if (this.isElementInViewport(render_package.elem) === false) {
          return callback(true);
        }
        if (this.stopRender === true) {
          return callback(true);
        }
        $element = $(render_package.elem);
        start_delimiter = render_package.start_delimiter;
        end_delimiter = render_package.end_delimiter;
        $newelement = $("<mathjax>").html(start_delimiter + $element.text() + end_delimiter);
        $element.replaceWith($newelement.get(0));
        QUEUE = this.MathJaxQueue;
        some_callback = function() {
          return callback();
        };
        QUEUE.Push(["Typeset", MathJax.Hub, $newelement.get(0), callback]);
      };
      work_package = {
        f: render_process,
        _this: this,
        _args: [render_package]
      };
      _queue.push(work_package, function(cancelled) {});
    };

    _LazyLoad.prototype.watchproperty = function(parent_obj, property, callback) {
      if ((parent_obj != null ? parent_obj[property] : void 0) != null) {
        callback(parent_obj[property]);
      } else {
        parent_obj.watch(property, function(id, oldval, newval) {
          callback(newval);
          return newval;
        });
      }
    };

    _LazyLoad.prototype.isElementInViewport = function(el) {
      var $, rect;
      $ = this.$;
      rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && rect.bottom <= $(this.window).height() && rect.right <= $(this.window).width();
    };

    _LazyLoad.prototype.escapeRegExp = function(str) {
      return str.replace(/[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&");
    };

    _LazyLoad.prototype.init_object_watch = function() {
      if (!Object.prototype.watch) {
        Object.defineProperty(Object.prototype, "watch", {
          enumerable: false,
          configurable: true,
          writable: false,
          value: function(prop, handler) {
            var getter, newval, oldval, setter;
            oldval = this[prop];
            newval = oldval;
            getter = function() {
              return newval;
            };
            setter = function(val) {
              oldval = newval;
              return newval = handler.call(this, prop, oldval, val);
            };
            if (delete this[prop]) {
              return Object.defineProperty(this, prop, {
                get: getter,
                set: setter,
                enumerable: true,
                configurable: true
              });
            }
          }
        });
      }
      if (!Object.prototype.unwatch) {
        Object.defineProperty(Object.prototype, "unwatch", {
          enumerable: false,
          configurable: true,
          writable: false,
          value: function(prop) {
            var val;
            val = this[prop];
            delete this[prop];
            return this[prop] = val;
          }
        });
      }
    };

    return _LazyLoad;

  })();
  Singleton = (function() {
    var instance;

    function Singleton() {}

    instance = null;

    Singleton.get = function(window) {
      if (instance == null) {
        instance = new _LazyLoad(window);
      }
    };

    return Singleton;

  })();
  return Singleton;
});

// Generated by CoffeeScript 1.6.3
/*
!
mathjax-lazyload v1.0.1
https://github.com/Dashed/mathjax-lazyload

Alberto Leal (c) 2013 MIT License
*/

(function(window) {
  requirejs.config({
    enforceDefine: true,
    urlArgs: 'bust=' + (new Date()).getTime(),
    paths: {
      'lodash': 'libs/lodash.custom',
      'async': 'libs/async'
    },
    shim: {
      lodash: {
        exports: '_'
      },
      "app": {
        deps: ['lodash', 'async'],
        exports: "_LazyLoad"
      }
    }
  });
  require(["app"], function(_LazyLoad) {
    _LazyLoad.get(window);
  });
})(window || (1, eval)("this"));

define("main", function(){});

require(["main"]);
}());