## How it works under the hood ?

Genenric-rrweb-recorder is based on 2 major tools:

    - [rrweb](https://github.com/rrweb-io/rrweb)
    - [WebAudioRecorder](https://github.com/higuma/web-audio-recorder-js)

As soon as you click the record Button, the webAudioRecorder launch.

It will record your audio via the mic of your computer

Rrweb works by registering the dom once, then all of your events (mouse, keyboard) into a array of events, which lead to really small files.

Once the record is finished, the audio is encoded into MP3. The array of events is transformed into json.

If you click on the download Button, the script integrate the json events into a replay webpage.

We are forced to use this technique to bypass security measures that does not allow us to automatically load a local json file.

Then, [jszip](https://github.com/Stuk/jszip) create a zip containing the json events, the mp3 audio, rrweb to play it locally, and the replay webpage.

This archive is available for download, and allow you to replay it offline.

To give a idea of the smallness of the archive, 1 minute of recording on the example page ([here](https://telecom-paris.github.io/generic-rrweb-recorder/example)) is ~ 1.4 mb (everything included)