"use strict";
/**
 * @fileoverview Phone
 */

/* Phone
 * @class Phone
 */

module.exports = function (SIP) {

    var CallSession = require('./Phone/CallSession')(SIP);
    var AudioPlayer = require('./Phone/AudioPlayer')();

    /*
     * @param {Object} options
     */
    var Phone = function (options) {
        /*
         *  {
         *    media: {
         *      remote: {
         *        audio: <DOM element>,
         *        video: <DOM element>
         *      },
         *      local: {
         *        video: <DOM element>
         *      }
         *    },
         *    sounds: {
         *      dtmf: <audio DOM element>,
         *      ringtone: <audio DOM element>
         *      ringbacktone: <audio DOM element>
         *    },
         *    ua: {
         *       <UA Configuration Options (optional)>
         *    }
         *  }
         */

        this.sessions = [];

        this.dtmfTone = new AudioPlayer(options.sounds.dtmf);
        this.ringtone = new AudioPlayer(options.sounds.ringtone, 'loop');
        this.ringbacktone = new AudioPlayer(options.sounds.ringbacktone, 'loop');

        this.video = options.media.remote.video ? true : false;
        this.audio = options.media.remote.audio ? true : false;

        if (!this.audio && !this.video) {
            // Need to do at least audio or video
            throw new Error('At least one remote audio or video element is required for Phone.');
        }

        this.options = options;
        var uaOptions = options.ua || {};

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
            this.addCallSession(callSession);
            this.ringbacktone.start();
            this.emit('ringing', callSession);
        }.bind(this));

        this.ua.on('message', function (message) {
            this.emit('message', message);
        }.bind(this));

        return this;
    };

    Phone.prototype = Object.create(SIP.EventEmitter.prototype);

    // Public

    Phone.prototype.call = function (destination) {
        if (!this.ua || !this.checkRegistration()) {
            this.logger.warn('A registered UA is required for calling');
            return;
        }

        var session = this.ua.invite(destination, {
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: this.audio,
                    video: this.video
                }
            }
        });

        session.on('connecting', function () {
            this.ringbacktone.start();
        }.bind(this));

        session.on('terminated', function () {
            this.ringbacktone.stop();
        }.bind(this));

        var callSession = new CallSession(this, session, this.options.media);
        this.addCallSession(callSession);

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
            this.sessions.splice(i, 1);
        }.bind(this));
    };

    return Phone;
};
