# webCriticalCSS

A web wrapper around [criticalCSS](https://github.com/filamentgroup/criticalcss) for finding critical-path, above the fold CSS.  Because sometimes we're too lazy to install stuff.

Alternative implementations:
* [critical](https://github.com/addyosmani/critical)
* [Penthouse](https://github.com/pocketjoso/penthouse)

Todo:
* Add error handling
* Add waiting indicator
* Add sanity check on input
* sites like hilary clintons print stuff to console, and it ends up in css.  Why?
* Tests (specifically, make sure things like :before content show up)
* Fork criticalCSS and patch so it can accept input directly, rather than reading from a resource.  Hopefully that'll speed up response (3+seconds on Heroku? ewww)
* Google Analytics
* Maybe allow a choice between picking critical, criticalCSS, and Penthouse (or my own)

# Why?
Inlining critical-path CSS is good for performance.  Prevents another round trip, and prevent redering from being blocked.  And I wanted to learn some nodejs.

# Release History
* v0.1.0: Get it out.