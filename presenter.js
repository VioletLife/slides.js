/* jshint browser:true */
/* global $:true */

var api = {
  config: {
    scaling: 'superfit'
  },
  slides: null,
  currentSlideNumber: null,
  events: {
    slideChange: []
  },
  on: function(eventName, eventCallback) {
    if (this.events.hasOwnProperty(eventName)) {
      this.events[eventName].push(eventCallback);
    }
  },
  trigger: function(eventName, eventArgs) {
    if (this.events.hasOwnProperty(eventName)) {
      this.events[eventName].forEach(function(callback) {
        callback(eventArgs);
      });
    }
  },
  prev: function() {
    // Reveal previous fragment or go to next slide.
    var lastVisibleFragment = this.currentSlide.find('.fragment.visible').last().removeClass('visible');
    if (!lastVisibleFragment.length) this.goToSlide(this.currentSlideNumber - 1);
  },
  next: function() {
    // Reveal next fragment or go to next slide.
    var firstHiddenFragment = this.currentSlide.find('.fragment:not(.visible)').first().addClass('visible');
    if (!firstHiddenFragment.length) this.goToSlide(this.currentSlideNumber + 1);
  },
  goToSlide: function(n) {
    // Do not go past last slide.
    if (this.currentSlideNumber === this.slides.length && n > this.slides.length) return;
    // Go to first slide if n is out of range.
    if ((n > this.slides.length || n < 1)) n = 1;
    if (n === this.currentSlideNumber) return;
    this.currentSlideNumber = window.location.hash = n;
    if (this.currentSlide) this.currentSlide.removeClass('active');
    this.currentSlide = this.getSlide(n).addClass('active');
    this.normalize();
    this.trigger('slideChange');
  },
  getSlide: function(n) {
    return this.slides.filter('[data-slide-number="' + n + '"]');
  },
  normalize: function() {
    // Recalculate current slides scaling and position to fit viewport dimensions.

    // var aspectRatio = $(window).width() / $(window).height();
    // this.currentSlide.css('width', this.currentSlide.height() * aspectRatio);
    var heightRatio = $(window).height() / this.currentSlide.outerHeight();
    var widthRatio = $(window).width() / this.currentSlide.outerWidth();
    var scaleFactor = Math.min(heightRatio, widthRatio);

    // Scaling leads to flickering and blur on opacity transition in webkit.
    // This can be compensated for by setting backface-visibility: hidden;
    // Although, this gives constant blur.
    if (this.config.scaling === 'superfit') {
      this.currentSlide.css('transform', 'scale(' + scaleFactor + ')');
    } else if (this.config.scaling === 'fit') {
      this.currentSlide.css('transform', 'scale(' + (scaleFactor < 1 ? scaleFactor : 1) + ')');
    }
    this.currentSlide.css({
      top: Math.floor(($(window).height() - this.currentSlide.outerHeight()) / 2),
      left: Math.floor(($(window).width() - this.currentSlide.outerWidth()) / 2),
    });
  },
  init: function(config) {
    config = config || {};
    if (config.scaling) this.config.scaling = config.scaling;
    this.slides = $(config.selector || '.slides').children('.slide');
    this.slides.each(function(idx) {
      $(this).attr('data-slide-number', idx+1);
    });
    var newSlideNumber = 1;
    if (window.location.hash) {
      newSlideNumber = parseInt(window.location.hash.substr(1));
    }
    this.goToSlide(newSlideNumber);
    this.normalize();
    setTimeout(this.normalize.bind(this), 100); // Useful if webfonts are loading slowly.
    $(window).resize(this.normalize.bind(this));
    $(window).on('hashchange', function() { this.goToSlide(parseInt(window.location.hash.substr(1))); }.bind(this));
    $(window).keydown(function(e) {
      switch(e.keyCode) {
        case 33: // pg up
        case 37: // left
        case 38: // up
          api.prev();
          e.preventDefault();
          break;
        case 32: // space
        case 34: // pg down
        case 39: // right
        case 40: // down
          api.next();
          e.preventDefault();
          break;
        case 67: // c
          // toggle cursor
          if ($('html').css('cursor') === 'none') {
            $('html').css('cursor', 'url(http://blog.ginchen.de/wp-content/uploads/2009/08/gdlib-png/) 10 10, default');
          } else {
            $('html').css('cursor', 'none');
          }
      }
    });
  }
};
