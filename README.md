# Generic-rrweb-recorder

### How to install it ?

Just include a line in the header of your website :

(or at the bottom of your body if you want your website to load faster)

```
<script type="text/javascript" type="module" src="path/to/recorder.js"></script>
```

If you are looking for the minified version, it can be found under [min](min/) folder.
To include the minified version, you can do:
```
<script type="text/javascript" type="module" src="path/to/recorder.min.js"></script>
```
See [here](#the-minified-version) for mor info about the minified version.

The script takes care of the rest.

### Customize it as you want:

The script has a basic configuration, but here is what you can customize:
- if script is lauching when page is loaded (default is **true**)
- position (default is **"bottom-right"**)
  list of avaibalble position:
  - bottom
  - bottom-right
  - bottom-left
  - top
  - top-right
  - top-left
  - middle
  - middle-right
  - middle-left
- if the buttons are movable (default is **true**)
- if the log is printed or not (default is **true**)
- Color of the record Button (The main Button) (default is **red**);
- Color of the pause / download Button (default is **yellow**);

### More documentation

To build the documentation, you need [jsdoc](https://jsdoc.app/index.html).

Once installed, you can build the documentation using:
```jsdoc srcs/*.js README.md -d docs/generated-doc/```

You will find it under the docs folder, in HTML format. ([here](docs/generated-doc))

### The minified version

To make the minified version, you need [Uglifyjs-folder](https://github.com/ionutvmi/uglifyjs-folder).

Once installed, you can use it doing:
```uglifyjs-folder -e -o min/ srcs/```

### Licences and credits

This project use the following libraries:

[rrweb](https://github.com/rrweb-io/rrweb)

[jszip](https://github.com/Stuk/jszip)

[WebAudioRecorder](https://github.com/higuma/web-audio-recorder-js)

[ConcatenateBlob](https://github.com/muaz-khan/ConcatenateBlobs)

Because the images we use are free, here is the websites where we found them:
- https://www.flaticon.com
- https://material.io/resources/icons
- https://icons8.com/
