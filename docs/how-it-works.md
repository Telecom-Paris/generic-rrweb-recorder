## How it works under the hood ?

Genenric-rrweb-recorder is based on 2 major tools:

    - [rrweb](https://github.com/rrweb-io/rrweb)
    - [WebAudioRecorder](https://github.com/higuma/web-audio-recorder-js)

When loadScripts is launched (either manually via ```loadScripts()``` or automatically via ```startRecord()```), it download and add the scripts file to the header of the webpage.

Once ```startRecord()``` is launched, it check those scripts have been loaded, ask authorisations for mic access, and start recording.

One ```stopRecord()``` is launched, it stop using mic access and encode into the wanted codec.

If you trigger ```downRecord()```, [jszip](https://github.com/Stuk/jszip) create a zip containing the json events, the audio file, rrweb to play it locally, and the replay webpage.

This archive is available for download, and allow you to replay it offline.

To give a idea of the smallness of the archive, 1 minute of recording on the example page ([here](https://telecom-paris.github.io/generic-rrweb-recorder/example)) is ~ 1.4 mb (archive size)