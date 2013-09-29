((window) ->

  requirejs.config
    enforceDefine: true
    urlArgs: 'bust=' + (new Date()).getTime()
    paths:
      # 'jquery': 'libs/jquery-1.10.2.min'
      # 'jquery': 'http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min'
      'lodash': 'libs/lodash.custom'
      'xregexp': 'libs/xregexp-amd'
      'async': 'libs/async'

    shim:
      # jquery:
      #   exports: '$'

      lodash:
        exports: '_'

      "app":
        #deps: ['jquery', 'lodash', 'xregexp', 'async']
        deps: ['lodash', 'xregexp', 'async']
        exports: "_LazyLoad"


  require ["app"], (_LazyLoad)->
    _LazyLoad.get(window)
    return

  return
  # see: https://github.com/shichuan/javascript-patterns/blob/master/general-patterns/access-to-global-object.html
  #)(if typeof window is "undefined" then this else window)
)(window or (1
eval
)("this"))



