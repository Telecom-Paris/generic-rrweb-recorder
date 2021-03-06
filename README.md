# Generic-rrweb-recorder

![](https://img.badgesize.io/Telecom-Paris/generic-rrweb-recorder/dev/srcs/recorder.js)
![](https://img.badgesize.io/Telecom-Paris/generic-rrweb-recorder/dev/min/srcs/recorder.min.js?label=Minified_version)
![](https://img.badgesize.io/Telecom-Paris/generic-rrweb-recorder/dev/srcs/recorder.js?compression=gzip)

### What is generic-rrweb-recorder ?

Generic-rrweb-recorder is a tool to record the dom of a web page as well as the sound of the microphone.

The advantage compared to a video?

You can copy/paste the text, and the files are extremely light!

Test it [here](https://telecom-paris.github.io/generic-rrweb-recorder-ui/example/)

If you want to know how it works under the hood, please see [this](docs/how-it-works.md) doc

### Cloning this repo

This repo is using submodules.

Do not forget to clone the repo using ```--recursive``` option

```
git clone --recursive https://github.com/Telecom-Paris/generic-rrweb-recorder.git
```

To test it, you need to use a server, due to security reasons.

### How to install it ?

Just include a line in the header of your website :

(or at the bottom of the body if you want your website to load faster)

```
<script type="text/javascript" src="path/to/recorder.js"></script>
```

If you are looking for the minified version, it can be found under the [min](min/) folder.
To include the minified version, you can use:
```
<script type="text/javascript" src="path/to/recorder.min.js"></script>
```
See [here](#the-minified-version) for more info about the minified version.

### How to use it ?

First, you need to create a new recorder Object:
```let myRecorder = new Recorder();```

If you want to load the scripts required by the recorder:
```myRecorder.loadScripts();```

If you do not want to handle this, the ```startRecord()``` function handles it for you.

This option is only available if you want to load those scripts directly after your webpage.

To start a record:
```myRecorder.startRecord();```

To pause a record:
```myRecorder.pauseRecord();```

To resume a record:
```myRecorder.resumeRecord();```

To stop a record:
```myRecorder.stopRecord();```

To dowbload a record as a zip file:
```myRecorder.downRecord();```

### More documentation

To build the documentation, you need [jsdoc](https://jsdoc.app/index.html).

Once installed, you can build the documentation using:
```jsdoc srcs/*.js README.md -d docs/generated-doc/```

You will find it under the docs folder, in HTML format. ([here](docs/generated-doc))
You can also find answers to common questions [here](docs/FAQ.md)

### The minified version


### Licences and credits

This project use the following libraries:

[rrweb](https://github.com/rrweb-io/rrweb)

[jszip](https://github.com/Stuk/jszip)

[WebAudioRecorder](https://github.com/higuma/web-audio-recorder-js)

[ConcatenateBlob](https://github.com/muaz-khan/ConcatenateBlobs)

[simple-mp3-cutter](https://github.com/lubenard/simple-mp3-cutter)
