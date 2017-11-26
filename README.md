# SIP.js

[![Build Status](https://travis-ci.org/onsip/SIP.js.png?branch=master)](https://travis-ci.org/onsip/SIP.js)

A JavaScript SIP stack for WebRTC, instant messaging, and more!


## This fork offers a simple multi session audio/video phone

Use it like this:

<aside class="warning">
This is not released now!
</aside>

```javascript

var phone = new SIP.WebRTC.Phone({
    media: {
        remote: {
            audio: $('<audio></audio>').appendTo('body')[0],
            video: $('<video></video>').appendTo('body')[0]
        },
        local: {
            video: $('<video muted></video>').appendTo('body')[0]
        }
    },
    sounds: {
        dtmf: $('<audio><source src="/content/sounds/dtmf.wav" type="audio/mpeg"/></audio>').appendTo('body')[0],
        ringtone: $('<audio><source src="/content/sounds/ringtone.wav" type="audio/mpeg"/></audio>').appendTo('body')[0],
        ringbacktone: $('<audio><source src="/content/sounds/ringbacktone.wav" type="audio/mpeg"/></audio>').appendTo('body')[0]
    },
    ua: {
        wsServers: ['wss://my.webrtc.endpoint.com:8089/ws'],

        displayName: 'Bob',
        uri: 'Bob@myrealm.com',
        authorizationUser: 'Bob',
        password: 'MyPassword',

        log: 'debug', //'log', 'warn', 'error'
        traceSip: true // log sip requsts and responses
        // ...
    }
});

phone.on('ringing', function (calSession) {
    setupCallsession(callSession);

    // answare the call by simply do this:
    callSession.answer();

    if (phone.sessions[0] == callSession){
        // this is the first callSession
        // you can have multiple in parallel :)
    }

});
phone.on('message', function (message) {
    // message received
});


// do a call
function call(number){
    var callSession = phone.call(number);
    setupCallSession(callSession);
}

// send a message
function sendMessage(number, text){
    phone.message(number, text);
}


// listen for events to change UI
function setupCallsession(callSession) {
    callSession.on('connecting', function (session) {
        // call connecting
    });
    callSession.on('connected', function (session) {
        // call connected
    });
    callSession.on('ended', function (session) {
        // call ended
    });
    callSession.on('hold', function (session) {
        // call placed on hold
    });
    callSession.on('unhold', function (session) {
        // call resumed after hold
    });
    callSession.on('dtmf', function (tone) {
        // dtmf sended
    });
}

```

## Website and Documentation

* [SIPjs.com](https://sipjs.com)
* [Mailing List](https://groups.google.com/forum/#!forum/sip_js)
* [Issue Tracking](https://github.com/onsip/sip.js/issues)


## Download

* [sipjs.com/download](https://sipjs.com/download/)
* Bower: `bower install sip.js`
* npm: `npm install sip.js`

## Authors

### James Criscuolo

* <james@onsip.com>
* GitHub [@james-criscuolo](https://github.com/james-criscuolo)

### Eric Green

* <eric.green@onsip.com>
* GitHub [@egreenmachine](https://github.com/egreenmachine)

### Joseph Frazier

* <1212jtraceur@gmail.com>
* GitHub [@josephfrazier](https://github.com/josephfrazier)
* Twitter [@josephfrazier_](https://twitter.com/josephfrazier_)

### Will Mitchell

* <wakamoleguy@gmail.com>
* GitHub [@wakamoleguy](http://github.com/wakamoleguy)
* Twitter [@wakamoleguy](http://twitter.com/wakamoleguy)

### JsSIP Authors

SIP.js contains substantial portions of the JsSIP software. JsSIP's authors at time of fork are listed below. For up to date information about JsSIP, please visit [jssip.net](http://jssip.net)

* José Luis Millán
* Iñaki Baz Castillo
* Saúl Ibarra Corretgé

## License

SIP.js is released under the [MIT license](https://sipjs.com/license).

SIP.js contains substantial portions of the JsSIP software, under the following license:

~~~
Copyright (c) 2012-2013 José Luis Millán - Versatica <http://www.versatica.com>

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

~~~
