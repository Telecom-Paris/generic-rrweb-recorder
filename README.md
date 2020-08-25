# Generic-rrweb-recorder

### How to install it ?

Just include a line in the header of your website :

(or at the bottom of your body if you want your website to load faster)

```
<script type="text/javascript" src="path/to/recorder.js"></script>
```

The script takes care of the rest.

### Customize it as you want:

The script has a basic configuration, but here is what you can customize:
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

Once installed, you can build the documentation using
```jsdoc *.js README.md -d docs/generated-doc/```

You will find it under the doc folder, in HTML format

### Licences and credits

This project use the following libraries:

[rrweb](https://github.com/rrweb-io/rrweb)

[jszip](https://github.com/Stuk/jszip)

[WebAudioRecorder](https://github.com/higuma/web-audio-recorder-js)

Because the images we use are free, here is the websites where we found them:
- https://www.flaticon.com
- https://material.io/resources/icons
- https://icons8.com/
