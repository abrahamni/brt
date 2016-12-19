/*!
    VideoPlayer
    Unified HTML5 and Youtube video player.

    Lasha Tavartkiladze
    2016-03-09
*/

(function () {
    'use strict';

    var youtubeCallbacks = [];
    var youtubeReady = false;
    var youtubeUrlRegex = /youtube.com|youtu.be/i;
    var youtubeIdregex = /v=([^&]+)&?/;



    //
    // Create a new video player.
    //
    function VideoPlayer(container, options) {
        if (!(this instanceof VideoPlayer)) {
            return new VideoPlayer(container, options);
        }

        if (typeof container === 'string') {
            this.container = document.querySelector(container);
        } else if (container && container.nodeType) {
            this.container = container;
        } else {
            return;
        }
        
        return this.init(options || {});
    }



    //
    // Initialize a player instance.
    //
    VideoPlayer.prototype.init = function (options) {
        this.container.innerHTML = '';

        this.src    = options.src    || this.container.getAttribute('data-src');
        this.width  = options.width  || this.container.offsetWidth;
        this.height = options.height || this.container.offsetHeight;

        if (!this.src) {
            return this;
        }

        if (youtubeUrlRegex.test(this.src)) {
            this.createYoutubePlayer();
        } else {
            this.createHTML5Player();
        }

        return this;
    };



    //
    // Create a new YouTube player.
    //
    VideoPlayer.prototype.createYoutubePlayer = function () {
        var self = this;
        var playerCanvas = document.createElement('div');
        var settings = {
            height: self.width,
            width: self.height,
            videoId: self.src.match(youtubeIdregex)[1],
            playerVars: {
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
                enablejsapi: 0
            },
            events: {}
        };
        self.container.appendChild(playerCanvas);

        function f() {
            new YT.Player(playerCanvas, settings);
        }

        if (youtubeReady) {
            f();
        } else {
            loadYoutubeAPI();
            youtubeCallbacks.push(f);
        }
    };



    //
    // Create a new HTML5 player.
    //
    VideoPlayer.prototype.createHTML5Player = function () {
        var videoEl = document.createElement('video');

        videoEl.setAttribute('width', this.width);
        videoEl.setAttribute('height', this.height);
        videoEl.setAttribute('src', this.src);
        videoEl.setAttribute('controls', 'controls');
        videoEl.setAttribute('style', 'object-fit: cover;');
        
        this.container.appendChild(videoEl);
    };



    //
    // Load Yutube API script file.
    //
    function loadYoutubeAPI() {
        var id = 'youtube-api-script';
        var script = document.getElementById(id);

        if (!script) {
            script = document.createElement('script');
            script.setAttribute('id', id);
            script.setAttribute('src', 'https://www.youtube.com/iframe_api');
            document.getElementsByTagName('head')[0].appendChild(script);
        }
    }



    //
    // Youtube API calls this global function when loaded.
    //
    window.onYouTubeIframeAPIReady = function () {
        youtubeReady = true;

        for (var i = 0; i < youtubeCallbacks.length; i += 1) {
            if (typeof youtubeCallbacks[i] === 'function') {
                youtubeCallbacks[i]();
            }
        }
    };



    //
    // Public API
    //
    APP.VideoPlayer = VideoPlayer;

})();