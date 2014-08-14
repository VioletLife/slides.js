/* jshint browser:true */
/* global $:true */

var api = {
  config: {
    rootSelector: '.slides', //
    scaling: 'superfit',     // none, fit, superfit
    valign: 'center',        // top, center, bottom
    halign: 'center',        // left, center, right
    transition: 'none'       // none
  },
  root: null,
  slides: null,
  currentSlideNumber: null,
  currentSlide: null,
  currentFragmentNumber: null,
  numberOfFragmentsInCurrentSlide: null,
  events: {
    slideChange: [],
    fragmentChange: [] // not triggered on slideChange
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
    if (!lastVisibleFragment.length) {
      this.goToSlide(this.currentSlideNumber - 1);
    } else {
      this.currentFragmentNumber = this.currentSlide.find('.fragment.visible').length;
      this.trigger('fragmentChange');
    }
  },
  next: function() {
    // Reveal next fragment or go to next slide.
    var firstHiddenFragment = this.currentSlide.find('.fragment:not(.visible)').first().addClass('visible');
    if (!firstHiddenFragment.length) {
      this.goToSlide(this.currentSlideNumber + 1);
    } else {
      this.currentFragmentNumber = this.currentSlide.find('.fragment.visible').length;
      this.trigger('fragmentChange');
    }
  },
  goToSlide: function(n) {
    // Do not go past last slide.
    if (this.currentSlideNumber === this.slides.length && n > this.slides.length) return;
    // Go to first slide if n is out of range.
    if ((n > this.slides.length || n < 1)) n = 1;
    if (n === this.currentSlideNumber) return;
    this.currentSlideNumber = window.location.hash = n;
    if (this.currentSlide) this.currentSlide.removeClass('active');
    this.currentSlide = this.slides.filter('[data-slide-number="' + n + '"]').addClass('active');
    this.normalize();
    this.currentFragmentNumber = this.currentSlide.find('.fragment.visible').length;
    this.numberOfFragmentsInCurrentSlide = this.currentSlide.find('.fragment').length;
    this.trigger('slideChange');
  },
  normalize: function() {
    // Recalculate current slides scaling and position to fit viewport dimensions.

    // var aspectRatio = this.root.width() / this.root.height();
    // this.currentSlide.css('width', this.currentSlide.height() * aspectRatio);
    var heightRatio = this.root.height() / this.currentSlide.outerHeight();
    var widthRatio = this.root.width() / this.currentSlide.outerWidth();
    var scaleFactor = Math.min(heightRatio, widthRatio);

    // Scaling leads to flickering and blur on opacity transition in webkit.
    // This can be compensated for by setting backface-visibility: hidden;
    // Although, this gives constant blur.
    if (this.config.scaling === 'none') {
      scaleFactor = 1;
    } else if (this.config.scaling === 'fit') {
      scaleFactor = scaleFactor < 1 ? scaleFactor : 1;
    }
    this.currentSlide.css('transform', 'scale(' + scaleFactor + ')');
    if (this.config.valign === 'top') {
      this.currentSlide.css('top', this.currentSlide.outerHeight()*(scaleFactor-1)/2);
    } else if (this.config.valign === 'center') {
      this.currentSlide.css('top', Math.floor((this.root.height() - this.currentSlide.outerHeight()) / 2));
    } else if (this.config.valign === 'bottom') {
      this.currentSlide.css('bottom', this.currentSlide.outerHeight()*(scaleFactor-1)/2);
    }
    if (this.config.halign === 'left') {
      this.currentSlide.css('left', this.currentSlide.outerWidth()*(scaleFactor-1)/2);
    } else if (this.config.halign === 'center') {
      this.currentSlide.css('left', Math.floor((this.root.width() - this.currentSlide.outerWidth()) / 2));
    } else if (this.config.halign === 'right') {
      this.currentSlide.css('right', this.currentSlide.outerWidth()*(scaleFactor-1)/2);
    }
  },
  init: function(config, callback) {
    if (config) {
      for (var key in config) {
        if (config.hasOwnProperty(key)) {
          this.config[key] = config[key];
        }
      }
    }
    $(function() {
      this.root = $(this.config.rootSelector);
      this.slides = this.root.children('.slide');
      this.slides.each(function(idx) {
        $(this).attr('data-slide-number', idx+1);
      });
      var initialSlideNumber = 1;
      if (window.location.hash) {
        initialSlideNumber = parseInt(window.location.hash.substr(1));
      }
      callback();
      this.goToSlide(initialSlideNumber);
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
    }.bind(this));
  }
};
