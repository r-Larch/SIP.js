"use strict";
/**
 * @fileoverview AudioPlayer
 */

/* AudioPlayer
 * @class AudioPlayer
 */

module.exports = function () {

    /*
     * @param {DOMElement} audioElement
     * @param {String} flag like 'loop', 'mute', etc..
     */
    function AudioPlayer(audioElement, flag) {
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
