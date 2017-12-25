"use strict";
/**
 * @fileoverview AudioPlayer
 */

/* AudioPlayer
 * @class AudioPlayer
 */

module.exports = function (document) {

    /*
     * @param {DOMElement} audioElement
     * @param {String} flag like 'loop', 'mute', etc..
     */
    function AudioPlayer(source, flag) {
        var audioElement = document.createElement("AUDIO");
        audioElement.src = source;
        audioElement.setAttribute("type", "audio/mpeg");
        document.body.appendChild(audioElement);
        this.element = audioElement;
        if (flag) {
            this.element[flag] = true;
        }
    }
    AudioPlayer.prototype.play = function () {
        try {
            this.element.play();
        } catch (e) {
            // ignore
        }
    };
    AudioPlayer.prototype.start = function () {
        try {
            this.element.play();
        } catch (e) {
            // ignore
        }
    };
    AudioPlayer.prototype.stop = function () {
        try {
            this.element.pause();
        } catch (e) {
            // ignore
        }
    };

    return AudioPlayer;
};
