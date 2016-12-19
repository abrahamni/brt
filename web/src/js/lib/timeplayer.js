/*!
    TimePlayer
    Move back and forth between dates with an interval.

    Lasha Tavartkiladze
    2016-08-12
*/

(function () {
    'use strict';

    var SECOND  = 1000;
    var MINUTE  = SECOND * 60;
    var HOUR    = MINUTE * 60;
    var DAY     = HOUR   * 24;
    var WEEK    = DAY    * 7;
    var MONTH   = WEEK   * 4;
    var QUARTER = MONTH  * 3;
    var YEAR    = MONTH  * 12;



    //
    // Public API
    //
    APP.TimePlayer = TimePlayer;



    //
    // Create a TimePlayer object.
    //
    function TimePlayer(options) {
        if (!(this instanceof TimePlayer)) {
            return new TimePlayer(options);
        }

        options = options || {};

        var player = this;
        
        player.startDate = dateTimestamp(options.startDate);
        player.endDate   = dateTimestamp(options.endDate);
        player.curValue  = player.startDate;
        player.interval  = options.interval || WEEK;
        player.playbackSpeed = options.playbackSpeed || SECOND;
        
        player.events = {
            'start' : [],
            'finish': [],
            'stop':   [],
            'pause' : [],
            'change': []
        };

        return player;
    }



    //
    // Start playback.
    //
    TimePlayer.prototype.play = function () {
        var player = this;
        
        function loop() {
            player.curValue += player.interval;

            if (player.curValue < player.endDate) {
                player.trigger('change', player.curValue);
                player.timeout = setTimeout(loop, player.playbackSpeed);
            } else {
                player.stop('finished');
            }
        }

        player.trigger('start', player.curValue);
        loop();

        return player;
    };



    //
    // Pause playback.
    //
    TimePlayer.prototype.pause = function () {
        var player = this;

        clearTimeout(player.timeout);
        player.trigger('pause', player.curValue);

        return player;
    };



    //
    // Stop playback.
    //
    TimePlayer.prototype.stop = function (finishedPlayback) {
        var player = this;

        clearTimeout(player.timeout);
        player.curValue = player.startDate;
        player.trigger('change', player.curValue);

        if (finishedPlayback) {
            player.trigger('finish', player.startDate, player.endDate);
        } else {
            player.trigger('stop', player.startDate, player.endDate);
        }

        return player;
    };



    //
    // Fast forward.
    //
    TimePlayer.prototype.forward = function () {
        var player = this;

        clearTimeout(player.timeout);

        if (player.curValue + player.interval <= player.endDate) {
            player.trigger('change', (player.curValue += player.interval));
        }

        return player;
    };



    //
    // Rewind.
    //
    TimePlayer.prototype.back = function () {
        var player = this;

        clearTimeout(player.timeout);

        if (player.curValue - player.interval >= player.startDate) {
            player.trigger('change', (player.curValue -= player.interval));
        }

        return player;
    };



    //
    // Add an event listsner to a player object.
    //
    TimePlayer.prototype.on = function (event, listener) {
        if (this.events[event]) {
            this.events[event].push(listener);
        }
    };



    //
    // Remove all event listeners from a player object.
    //
    TimePlayer.prototype.off = function (event) {
        if (this.events[event]) {
            this.events[event] = [];
        }
    };



    //
    // Trigger all event listeners on a player object.
    //
    TimePlayer.prototype.trigger = function (event) {
        var args, length, i;

        if (this.events[event]) {
            args = Array.prototype.slice.call(arguments, 1);
            length = this.events[event].length;

            for (i = 0; i < length; i += 1) {
                this.events[event][i].apply(this, args);
            }
        }
    };



    //
    // Update player range.
    //
    TimePlayer.prototype.update = function (startDate, endDate) {
        var player = this;

        player.startDate = dateTimestamp(startDate);
        player.endDate   = dateTimestamp(endDate);
        player.curValue  = player.startDate;

        return player;
    };



    //
    // Get timestamp value from a date.
    //
    function dateTimestamp(date) {
        if (Object.prototype.toString.call(date) === '[object Date]') {
            return date.getTime();
        } else if (typeof date === 'number') {
            return date;
        } else if (typeof date === 'string') {
            return Date.parse(date);
        } else {
            return null;
        }
    }

}());