"use strict";
/**
 * @fileoverview CallSession
 */

/* CallSession
 * @class CallSession
 */

module.exports = function (SIP) {

    var C = {
        STATUS_NULL: 0,
        STATUS_NEW: 1,
        STATUS_CONNECTING: 2,
        STATUS_CONNECTED: 3,
        STATUS_COMPLETED: 4
    };

    /*
     * @param {Object} options
     */
    var CallSession = function (phone, session, media) {
        /*
         *  media = {
         *      remote: {
         *        audio: <DOM element>,
         *        video: <DOM element>
         *      },
         *      local: {
         *        video: <DOM element>
         *      }
         *  }
         */

        this.phone = phone;
        this.session = session;
        this.setupSession();


        if (media.remote.video) {
            this.video = true;
        } else {
            this.video = false;
        }

        if (media.remote.audio) {
            this.audio = true;
        } else {
            this.audio = false;
        }

        if (!this.audio && !this.video) {
            // Need to do at least audio or video
            // Error
            throw new Error('At least one remote audio or video element is required for CallSession.');
        }

        this.media = media;

        // Safari hack, because you cannot call .play() from a non user action
        if (this.media.remote.audio) {
            this.media.remote.audio.autoplay = true;
        }
        if (this.media.remote.video) {
            this.media.remote.video.autoplay = true;
        }
        if (this.media.local && this.media.local.video) {
            this.media.local.video.autoplay = true;
            this.media.local.video.volume = 0;
        }

        this.state = C.STATUS_NULL;

        this.logger = this.phone.ua.getLogger('sip.CallSession');

        return this;
    };

    CallSession.prototype = Object.create(SIP.EventEmitter.prototype);
    CallSession.C = C;

    // Public

    CallSession.prototype.answer = function () {
        if (this.state !== C.STATUS_NEW && this.state !== C.STATUS_CONNECTING) {
            this.logger.warn('No call to answer');
            return;
        }
        // Safari hack, because you cannot call .play() from a non user action
        if (this.media.remote.audio) {
            this.media.remote.audio.autoplay = true;
        }
        if (this.media.remote.video) {
            this.media.remote.video.autoplay = true;
        }
        return this.session.accept({
            sessionDescriptionHandlerOptions: {
                constraints: {
                    audio: this.audio,
                    video: this.video
                }
            }
        }).sessionDescriptionHandler.once('addStream', function () {
            this.emit('answered');
        }.bind(this));
    };

    CallSession.prototype.reject = function () {
        if (this.state !== C.STATUS_NEW && this.state !== C.STATUS_CONNECTING) {
            this.logger.warn('Call is already answered');
            return;
        }
        try {
            return this.session.reject();
        } finally {
            this.phone.ringtone.stop();
            this.phone.ringbacktone.stop();
        }
    };

    CallSession.prototype.hangup = function () {
        if (this.state !== C.STATUS_CONNECTED && this.state !== C.STATUS_CONNECTING && this.state !== C.STATUS_NEW) {
            this.logger.warn('No active call to hang up on');
            return;
        }
        try {
            if (this.state !== C.STATUS_CONNECTED) {
                return this.session.cancel();
            } else {
                return this.session.bye();
            }
        } finally {
            this.phone.ringtone.stop();
            this.phone.ringbacktone.stop();
        }
    };

    CallSession.prototype.hold = function () {
        if (this.state !== C.STATUS_CONNECTED || this.session.local_hold) {
            this.logger.warn('Cannot put call on hold');
            return;
        }
        this.mute();
        this.logger.log('Placing session on hold');
        return this.session.hold();
    };

    CallSession.prototype.unhold = function () {
        if (this.state !== C.STATUS_CONNECTED || !this.session.local_hold) {
            this.logger.warn('Cannot unhold a call that is not on hold');
            return;
        }
        this.unmute();
        this.logger.log('Placing call off hold');
        return this.session.unhold();
    };

    CallSession.prototype.mute = function () {
        if (this.state !== C.STATUS_CONNECTED) {
            this.logger.warn('An acitve call is required to mute audio');
            return;
        }
        this.logger.log('Muting Audio');
        this.toggleMute(true);
    };

    CallSession.prototype.unmute = function () {
        if (this.state !== C.STATUS_CONNECTED) {
            this.logger.warn('An active call is required to unmute audio');
            return;
        }
        this.logger.log('Unmuting Audio');
        this.toggleMute(false);
    };

    CallSession.prototype.sendDTMF = function (tone) {
        if (this.state !== C.STATUS_CONNECTED) {
            this.logger.warn('An active call is required to send a DTMF tone');
            return;
        }
        this.logger.log('Sending DTMF tone: ' + tone);
        this.session.dtmf(tone);
        this.phone.dtmfTone.play();
    };

    // Private Helpers

    CallSession.prototype.setupRemoteMedia = function () {
        // If there is a video track, it will attach the video and audio to the same element
        var pc = this.session.sessionDescriptionHandler.peerConnection;
        var remoteStream;

        this.phone.ringtone.stop();
        this.phone.ringbacktone.stop();

        if (pc.getReceivers) {
            remoteStream = new global.window.MediaStream();
            pc.getReceivers().forEach(function (receiver) {
                var track = receiver.track;
                if (track) {
                    remoteStream.addTrack(track);
                }
            });
        } else {
            remoteStream = pc.getRemoteStreams()[0];
        }
        if (this.video) {
            this.media.remote.video.srcObject = remoteStream;
            this.media.remote.video.play().catch(function () {
                this.logger.log('play was rejected');
            }.bind(this));
        } else if (this.audio) {
            this.media.remote.audio.srcObject = remoteStream;
            this.media.remote.audio.play().catch(function () {
                this.logger.log('play was rejected');
            }.bind(this));
        }
    };

    CallSession.prototype.setupLocalMedia = function () {
        if (this.video && this.media.local && this.media.local.video) {
            var pc = this.session.sessionDescriptionHandler.peerConnection;
            var localStream;
            if (pc.getSenders) {
                localStream = new global.window.MediaStream();
                pc.getSenders().forEach(function (sender) {
                    var track = sender.track;
                    if (track && track.kind === 'video') {
                        localStream.addTrack(track);
                    }
                });
            } else {
                localStream = pc.getLocalStreams()[0];
            }
            this.media.local.video.srcObject = localStream;
            this.media.local.video.volume = 0;
            this.media.local.video.play();
        }
    };

    CallSession.prototype.cleanupMedia = function () {
        if (this.video) {
            this.media.remote.video.srcObject = null;
            this.media.remote.video.pause();
            if (this.media.local && this.media.local.video) {
                this.media.local.video.srcObject = null;
                this.media.local.video.pause();
            }
        }
        if (this.audio) {
            this.media.remote.audio.srcObject = null;
            this.media.remote.audio.pause();
        }
    };

    CallSession.prototype.setupSession = function () {
        this.state = C.STATUS_NEW;
        this.emit('new', this.session);

        this.session.on('progress', this.onProgress.bind(this));
        this.session.on('accepted', this.onAccepted.bind(this));
        this.session.on('rejected', this.onEnded.bind(this));
        this.session.on('failed', this.onFailed.bind(this));
        this.session.on('terminated', this.onEnded.bind(this));
    };

    CallSession.prototype.destroyMedia = function () {
        this.session.sessionDescriptionHandler.close();
    };

    CallSession.prototype.toggleMute = function (mute) {
        var pc = this.session.sessionDescriptionHandler.peerConnection;
        if (pc.getSenders) {
            pc.getSenders().forEach(function (sender) {
                if (sender.track) {
                    sender.track.enabled = !mute;
                }
            });
        } else {
            pc.getLocalStreams().forEach(function (stream) {
                stream.getAudioTracks().forEach(function (track) {
                    track.enabled = !mute;
                });
                stream.getVideoTracks().forEach(function (track) {
                    track.enabled = !mute;
                });
            });
        }
    };

    CallSession.prototype.onAccepted = function () {
        this.state = C.STATUS_CONNECTED;
        this.emit('connected', this.session);

        this.setupLocalMedia();
        this.setupRemoteMedia();
        this.session.sessionDescriptionHandler.on('addTrack', function () {
            this.logger.log('A track has been added, triggering new remoteMedia setup');
            this.setupRemoteMedia();
        }.bind(this));

        this.session.sessionDescriptionHandler.on('addStream', function () {
            this.logger.log('A stream has been added, trigger new remoteMedia setup');
            this.setupRemoteMedia();
        }.bind(this));

        this.session.on('hold', function () {
            this.emit('hold', this.session);
        }.bind(this));
        this.session.on('unhold', function () {
            this.emit('unhold', this.session);
        }.bind(this));
        this.session.on('dtmf', function (tone) {
            this.emit('dtmf', tone);
        }.bind(this));
        this.session.on('bye', this.onEnded.bind(this));
    };

    CallSession.prototype.onProgress = function () {
        this.state = C.STATUS_CONNECTING;
        this.emit('connecting', this.session);
    };

    CallSession.prototype.onFailed = function () {
        this.onEnded();
    };

    CallSession.prototype.onEnded = function () {
        this.state = C.STATUS_COMPLETED;
        this.emit('ended', this.session);
        this.cleanupMedia();
    };

    return CallSession;
};
