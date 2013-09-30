// Generated by CoffeeScript 1.6.3
define(function(require) {
  var Singleton, _LazyLoad;
  _LazyLoad = (function() {
    _LazyLoad.prototype.VERSION = '1.0.1';

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
        var getTextNodesIn, lazy_watch_queue, _escapeRegExp, _lmjxeventTimer;
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
        $(get_this.window).on("scroll.lmjx resize.lmjx", function() {
          _stopRender = true;
          if (_lmjxeventTimer) {
            clearTimeout(_lmjxeventTimer);
            _lmjxeventTimer = void 0;
          }
          return _lmjxeventTimer = setTimeout(function() {
            var _isElementInViewport;
            _stopRender = false;
            _isElementInViewport = get_this.isElementInViewport;
            return _.each(lazy_watch_queue, function(delimiter_to_watch, name) {
              var $elems, _renderMathJax;
              $elems = $(delimiter_to_watch.selector);
              if ($elems.size() > 0) {
                _renderMathJax = get_this.renderMathJax;
                return $elems.each(function() {
                  var render_package;
                  if (_stopRender === false && _isElementInViewport($(this).get(0)) === true) {
                    render_package = {
                      elem: this,
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
        $element.remove();
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
      var contains, docEl, eap, efp, has, rect, vHeight, vWidth, _window;
      _window = this.window;
      rect = el.getBoundingClientRect();
      docEl = _window.document.documentElement;
      vWidth = _window.innerWidth || docEl.clientWidth;
      vHeight = _window.innerHeight || docEl.clientHeight;
      efp = function(x, y) {
        return _window.document.elementFromPoint(x, y);
      };
      contains = ("contains" in el ? "contains" : "compareDocumentPosition");
      has = (contains === "contains" ? 1 : 0x10);
      if (rect.right < 0 || rect.bottom < 0 || rect.left > vWidth || rect.top > vHeight) {
        return false;
      }
      return (eap = efp(rect.left, rect.top)) === el || el[contains](eap) === has || (eap = efp(rect.right, rect.top)) === el || el[contains](eap) === has || (eap = efp(rect.right, rect.bottom)) === el || el[contains](eap) === has || (eap = efp(rect.left, rect.bottom)) === el || el[contains](eap) === has;
    };

    _LazyLoad.prototype.isElementInViewport_old = function(el) {
      var rect;
      rect = el.getBoundingClientRect();
      return rect.top >= 0 && rect.left >= 0 && rect.bottom <= (this.window.innerHeight || document.documentElement.clientHeight) && rect.right <= (this.window.innerWidth || document.documentElement.clientWidth);
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
