define (require) ->

  class _LazyLoad

    VERSION: '1.0.1'

    constructor: (window) ->

      @init_object_watch()

      # Init vars
      @window = window
      @$ = undefined
      @lmjxeventTimer = undefined

      # Watch MathJax

      get_this = @
      _watch = get_this.watchproperty

      # Watch for jquery
      _watch window, "$", ($)->

        get_this.$ = $

        _watch window, "MathJax", (_MathJax)->

          # Watch MathJax.Hub.config
          _watch _MathJax, "Hub", (MathJax_Hub)->
            _watch MathJax_Hub, "config", (MathJax_Hub_config)->

              # Watch MathJax.Hub.config.lazytex2jax
              # Required for lazyloading
              _watch MathJax_Hub_config, "lazytex2jax", (lazytex2jax)->

                # skipStartupTypeset is required for lazyloading
                _watch MathJax_Hub_config, "skipStartupTypeset", (skipStartupTypeset)->
                  _ = require('lodash')
                  if skipStartupTypeset is true and _.isObject(lazytex2jax)

                    get_this['lazytex2jax'] = lazytex2jax


                    _ = require('lodash')
                    _.defer((f, _this)->
                        f.call(_this)

                      , get_this.bootstrap, get_this )
                    return
                    

      async = require('async')
      return

    bootstrap: () ->
      _ = require('lodash')
      $ = @$
      # XRegExp = require('xregexp')
      # Rely on native regexp

      get_this = @
      @stopRender = false
      _stopRender = @stopRender

      $ ->

        # Convert all mathjax to lazy
        #####

        # Credit: http://stackoverflow.com/questions/298750/how-do-i-select-text-nodes-with-jquery
        getTextNodesIn = (el) ->
          $(el).find(":not(script,img,image,code,audio,input,textarea,button,iframe,canvas)").addBack().contents().filter ->
            @nodeType is 3

        _escapeRegExp = get_this.escapeRegExp

        lazy_watch_queue = {}


        # Note: Check precedence of $$ over $???
        _.each(get_this.lazytex2jax, (delimiter_pack, delimiter_pack_name) ->

          if not _.isArray(delimiter_pack)
            return

          _.each(delimiter_pack, (delimiter, index) ->

            if not _.isArray(delimiter)
              return

            start_delimiter = _escapeRegExp(delimiter[0])
            end_delimiter = _escapeRegExp(delimiter[1])

            regex_string = start_delimiter+'([\\s\\S]*?)'+end_delimiter



            #re = new XRegExp.cache(regex_string, "sg");
            re = new RegExp(regex_string, 'gi');

            $(getTextNodesIn('body')).each(()->
              $this = $(this)
              $text = $this.text()
              if re.test($text)


                #stamp = "lazymathjax[name='lazy-load-mathjax-stamp-#{name}']"
                stamp = "lazymathjax-stamp-#{name}"


                lazy_element = {}
                lazy_element.start_delimiter = delimiter[0]
                lazy_element.end_delimiter = delimiter[1]

                name = "#{delimiter_pack_name}-#{index}"
                stamp = "lazymathjax-stamp-#{name}"
                
                lazy_element.selector = stamp

                lazy_watch_queue[name] = lazy_element

                replacementpattern = "<#{stamp}>$1</#{stamp}>"


                #new_text = XRegExp.replace($text, re, replacementpattern)

                re.lastIndex = 0 # Needed for native. See: http://xregexp.com/cross_browser/
                new_text = $text.replace(re, replacementpattern)

                $this.replaceWith(new_text)
              return
              )
            return
            )
          return
          )

        # Watch lazy mathjax
        #####



        # mini plugin
        # should be a separate amd module
        #$.fn.inViewport = (options)->

        get_this.init_renderMathJax()

        _lmjxeventTimer = get_this.lmjxeventTimer
        $(get_this.window).on("scroll.lmjx resize.lmjx", ()->

          _stopRender = true

          if(_lmjxeventTimer)
            clearTimeout(_lmjxeventTimer)
            _lmjxeventTimer = undefined

          #clearTimeout $.data(this, "lmjxeventTimer")
          #$.data this, "lmjxeventTimer", setTimeout(->
          _lmjxeventTimer = setTimeout(->
            
            # End step of scroll and/or resize event

            _stopRender = false

            _isElementInViewport = get_this.isElementInViewport
            _.each(lazy_watch_queue, (delimiter_to_watch, name) ->

              $elems = $(delimiter_to_watch.selector)
              
              if ($elems.size() > 0)
                _renderMathJax = get_this.renderMathJax

                $elems.each(()->
                  
                  if(_stopRender is false and _isElementInViewport($(this).get(0)) is true)
                    # console.log $(this).get(0) is this
                    #_renderMathJax(this)
                    render_package = 
                      elem: this,
                      start_delimiter: delimiter_to_watch.start_delimiter,
                      end_delimiter: delimiter_to_watch.end_delimiter


                    _renderMathJax.call(get_this, render_package)

                  )
              )     

          , 1000)
          )

        $(get_this.window).trigger('scroll.lmjx')

      return

    init_renderMathJax: ()->
      async = require('async')
      _ = require('lodash')

      if(!@queue?)

        # Create worker
        worker = (_work, callback)->
          _f = _work['f']
          _this = _work['_this']
          _args = _work['_args'] or [] # an array
          _args.push(callback)

          _.defer((f, _this, _args)->
              f.apply(_this,_args)
            , _f, _this, _args )


        @queue = async.queue(worker, 2)

      if(!@MathJaxQueue? )
        @MathJaxQueue = @window.MathJax.Hub.queue

      return

    renderMathJax: (render_package)->

      _queue = @queue
      $ = @$

      render_process = (render_package, callback) ->

        if @isElementInViewport(render_package.elem) is false
          return callback(true)

        if @stopRender is true
          return callback(true)

        $element = $(render_package.elem)
        start_delimiter = render_package.start_delimiter
        end_delimiter = render_package.end_delimiter

        $newelement = $("<mathjax>").html(start_delimiter + $element.text() + end_delimiter)
        $element.replaceWith($newelement.get(0))
        $element.remove()

        QUEUE = @MathJaxQueue

        some_callback = ()->
          return callback()

        QUEUE.Push(["Typeset", MathJax.Hub, $newelement.get(0), callback])

        return
      
      # Object
      work_package =
        f: render_process,
        _this: @
        _args: [render_package]
      
      # Queue render work
      _queue.push(work_package, (cancelled)->
        #console.log "done!"
        )



      return

    # Watch property of parent_obj, and execute callback whenever it changed.
    # callback is called with parent_obj[property] as input

    # credit: http://stackoverflow.com/questions/1029241/javascript-object-watch-for-all-browsers
    watchproperty: (parent_obj, property, callback)->

      if parent_obj?[property]?
        callback(parent_obj[property])
      else
        parent_obj.watch property, (id, oldval, newval) ->
          callback(newval)
          return newval
      return

    # Credit: http://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
    isElementInViewport: (el) ->

      _window = @window

      rect = el.getBoundingClientRect()
      docEl = _window.document.documentElement
      vWidth = _window.innerWidth or docEl.clientWidth
      vHeight = _window.innerHeight or docEl.clientHeight
      efp = (x, y) ->
        _window.document.elementFromPoint x, y

      contains = (if "contains" of el then "contains" else "compareDocumentPosition")
      has = (if contains is "contains" then 1 else 0x10)
      
      # Return false if it's not in the viewport
      return false  if rect.right < 0 or rect.bottom < 0 or rect.left > vWidth or rect.top > vHeight
      
      # Return true if any of its four corners are visible
      (eap = efp(rect.left, rect.top)) is el or el[contains](eap) is has or (eap = efp(rect.right, rect.top)) is el or el[contains](eap) is has or (eap = efp(rect.right, rect.bottom)) is el or el[contains](eap) is has or (eap = efp(rect.left, rect.bottom)) is el or el[contains](eap) is has

    isElementInViewport_old: (el) ->
      rect = el.getBoundingClientRect()
      return rect.top >= 0 and rect.left >= 0 and rect.bottom <= (@window.innerHeight or document.documentElement.clientHeight) and rect.right <= (@window.innerWidth or document.documentElement.clientWidth)


    escapeRegExp: (str) ->
      str.replace /[\-\[\]{}()*+?.,\\\^$|#\s]/g, "\\$&" #.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");


    init_object_watch: () ->
      unless Object::watch
        Object.defineProperty Object::, "watch",
          enumerable: false
          configurable: true
          writable: false
          value: (prop, handler) ->
            oldval = this[prop]
            newval = oldval
            getter = ->
              newval

            setter = (val) ->
              oldval = newval
              newval = handler.call(this, prop, oldval, val)

            if delete this[prop] # can't watch constants
              Object.defineProperty this, prop,
                get: getter
                set: setter
                enumerable: true
                configurable: true



      # object.unwatch
      unless Object::unwatch
        Object.defineProperty Object::, "unwatch",
          enumerable: false
          configurable: true
          writable: false
          value: (prop) ->
            val = this[prop]
            delete this[prop] # remove accessors

            this[prop] = val

      return


  # Ensure mathjax lazyloading happens once
  class Singleton
    instance = null

    @get: (window) ->
      instance ?= new _LazyLoad(window)
      return

  return Singleton