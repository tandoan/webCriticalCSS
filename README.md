# Unnamed

A web wrapper around [criticalCSS](https://github.com/filamentgroup/criticalcss) for finding critical-path, above the fold CSS.  Because sometimes we're too lazy to install stuff.

Alternative implementations:
* [critical](https://github.com/addyosmani/critical)
* [Penthouse](https://github.com/pocketjoso/penthouse)

Todo:
* Add option to change screen size
* Add sanity check on input
* Cache results
* Promisify the code.  No more nested callbacks. No more fs.syncWriting
* Tests
* Format the code (eshint/lint etc)

# Why?
Inlining critical-path CSS is good for performance.  Prevents another round trip, and prevent redering from being blocked.  And I wanted to learn some nodejs.
