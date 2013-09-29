mathjax-lazyload 
================

By default MathJax renders (typeset) all math elements on a page.
This can freeze the browser for a while especially if there are many math elments to render.

`mathjax-lazyload.js` delays typesetting of MathJax elements until it comes into view of the browser.


Prerequisites
=============

1. [jQuery](http://jquery.com/)
2. [MathJax](http://mathjax.org)

Usage
=====

`mathjax-lazyload.js` may be placed anywhere where it can properly execute.

The script will automatically detect MathJax and jQuery. This allows the possibility for MathJax and/or jQuery to be dynamically loaded.

```HTML

<!-- Remember the mathjax config must be placed before MathJax.js -->
<script type="text/x-mathjax-config"> 
MathJax.Hub.Config({

  skipStartupTypeset: true,
  
  lazytex2jax: {
    displayMath: [['$$','$$'], ['\\[','\\]']],
    inlineMath: [['\\(','\\)']],
  },

 }); 
</script>

<script type="text/javascript"
  src="http://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML">
</script>

<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script src="path/to/mathjax-lazyload.js"></script>

```

## MathJax Configuration

mathjax-lazyload always require the following configuration conditions to run:

1. `skipStartupTypeset: true`

2. `lazytex2jax` is a defined object

***lazytex2jax***

The `inlineMath` and `displayMath` properties of `lazytex2jax` are in the same format as it is in `tex2jax`.
This needs to be manually set for users to decide what to lazy load.


*   `inlineMath`

    Array of pairs of strings that are to be used as in-line math delimiters. The first in each pair is the initial delimiter and the second is the terminal delimiter. You can have as many pairs as you want.    

    ```
    inlineMath: [ ['$','$'], ['\\(','\\)'] ]
    ```

*   `displayMath`

    Array of pairs of strings that are to be used as delimiters for displayed equations. The first in each pair is the initial delimiter and the second is the terminal delimiter. You can have as many pairs as you want.    

    ```
    displayMath: [ ['$$','$$'], ['\[','\]'] ]
    ```

See [tex2jax config options](http://docs.mathjax.org/en/latest/options/tex2jax.html).

Limitations
===========

1. MathJax's start typeset will need to be disabled because typesetting the page and converting math elements into a 'lazy state' will collide. Usually MathJax typesets the before mathjax-lazyload can do anything.

2. It isn't possible for mathjax-lazyload to automatically detect default math delimiters because configurations for these are loaded dynamically during typesetting. Since MathJax's startup typeset needs to be disabled (see above point), no extra configuration is loaded. Therefore users will need to manually tell mathjax-lazyload what kind of math delimiters to look for.

Changelog
=========

## 1.0.1 [Sep 29, 2013]

* Remove dependence on XRegExp (3rd party regex lib)

* Added more tags to avoid when finding MathJax elements to lazy load. 

  **Avoided tags:** image, code, audio, input, textarea, button 

* Minor build script improvement

## 1.0.0 [Sep 29, 2013]

* First commit

License
=======

MIT-License