"use strict";
/**
 * @fileoverview Phone
 */

/* Phone
 * @class Phone
 */

module.exports = function (SIP, document) {

    var CallSession = require('./Phone/CallSession')(SIP, document);
    var AudioPlayer = require('./Phone/AudioPlayer')(document);

    /*
     * @param {Object} options
     */
    var Phone = function (options) {
        /*
         *  {
         *    media: {
         *      local: {
         *        video: <DOM element>
         *      }
         *    },
         *    sounds: {
         *      dtmf: /audio/source/file.mp3,
         *      ringtone: /audio/source/file.mp3
         *      ringbacktone: /audio/source/file.mp3
         *    },
         *    ua: {
         *       <UA Configuration Options (optional)>
         *    }
         *  }
         */

        this.sessions = [];

        this.options = options;
        this.sounds = options.sounds || {};
        var uaOptions = options.ua || {};

        this.dtmfTone = new AudioPlayer(this.sounds.dtmf);

        // Fixed Options
        uaOptions.register = true;

        uaOptions.sessionDescriptionHandlerFactoryOptions = uaOptions.sessionDescriptionHandlerFactoryOptions || {};
        var browserUa = global.navigator.userAgent.toLowerCase();
        var isSafari = browserUa.indexOf('safari') > -1 && browserUa.indexOf('chrome') < 0;
        if (isSafari) {
            uaOptions.sessionDescriptionHandlerFactoryOptions.modifiers = [SIP.WebRTC.Modifiers.stripG722];
        }

        this.ua = new SIP.UA(uaOptions);
        this.logger = this.ua.getLogger('sip.Phone');


        this.ua.on('registered', function () {
            this.emit('registered', this.ua);
        }.bind(this));

        this.ua.on('unregistered', function () {
            this.emit('unregistered', this.ua);
        }.bind(this));

        this.ua.on('failed', function () {
            this.emit('unregistered', this.ua);
        }.bind(this));

        this.ua.on('invite', function (session) {
            var callSession = new CallSession(this, session, this.options.media);
            callSession.state = CallSession.C.STATUS_INCOMMEING;
            callSession.isRinging = true;
            //callSession.destination = null; // contact: "<sip:lidbg2d2@1qhgrcesff4s.invalid;transport=ws>"
            this.addCallSession(callSession);
            callSession.ringtone.start();

            session.on('accepted', function () {
                callSession.ringtone.stop();
                callSession.isRinging = false;
            });
            callSession.on('ended', function () {
                callSession.ringtone.stop();
                callSession.isRinging = false;
            });

            this.emit('ringing', callSession);
        }.bind(this));

        this.ua.on('message', function (message) {
            this.emit('message', message);
        }.bind(this));

        return this;
    };

    Phone.prototype = Object.create(SIP.EventEmitter.prototype);

    // Public

    Phone.prototype.call = function (destination, videoElement) {
        if (!this.ua || !this.checkRegistration()) {
            this.logger.warn('A registered UA is required for calling');
            return;
        }

        var session = this.ua.invite(destination, {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: videoElement == null,
                    video: videoElement != null
                }
            }
        });

        var media = Object.assign({}, this.options.media, { remote: { video: videoElement } });
        var callSession = new CallSession(this, session, media);
        this.addCallSession(callSession);

        session.on('connecting', function () {
            callSession.ringbacktone.start();
        });

        session.on('terminated', function () {
            callSession.ringbacktone.stop();
        });

        return callSession;
    };

    Phone.prototype.message = function (destination, message) {
        if (!this.ua || !this.checkRegistration()) {
            this.logger.warn('A registered UA is required to send a message');
            return;
        }
        if (!destination || !message) {
            this.logger.warn('A destination and message are required to send a message');
            return;
        }
        this.ua.message(destination, message);
    };


    // Private Helpers

    Phone.prototype.checkRegistration = function () {
        return this.ua && this.ua.isRegistered();
    };

    Phone.prototype.addCallSession = function (callSession) {
        this.sessions.push(callSession);

        callSession.on('ended', function() {
            var i = this.sessions.indexOf(callSession);
            if (i !== -1) {
                this.sessions.splice(i, 1);
            }
        }.bind(this));

        this.emit('new', callSession);
    };

    return Phone;
};
