/* jshint browser:true */
/* global $:true */

var api = {
  config: {
    rootSelector: '.slides',
    scaling: 'fit',           // none, fit, superfit
    valign: 'top',            // top, center, bottom
    halign: 'center',         // left, center, right
    transition: 'slide-fixed', // none, opacity, slide-flex, slide-fixed
    transitionDuration: 500
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
    // Don't update if desired slide is current slide.
    if (n === this.currentSlideNumber) return;
    // Change slide
    var prevSlideNumber = this.currentSlideNumber;
    var prevSlide = this.currentSlide;
    this.currentSlideNumber = window.location.hash = n;
    if (this.currentSlide) this.currentSlide.removeClass('active');
    this.currentSlide = this.slides.filter('[data-slide-number="' + n + '"]').addClass('active');
    // this.normalize();
    this.transition(prevSlide, this.currentSlide, this.currentSlideNumber > prevSlideNumber);
    if (this.currentSlideNumber < prevSlideNumber) {
      this.currentSlide.find('.fragment').addClass('visible');
    }
    this.numberOfFragmentsInCurrentSlide = this.currentSlide.find('.fragment').length;
    this.currentFragmentNumber = this.currentSlide.find('.fragment.visible').length;
    this.trigger('slideChange');
  },
  recalculate: function() {
    var that = this;
    this.slides.each(function() {
      var slide = $(this);
      slide.css('left', 0);
      setTimeout(function() {
        if (slide.innerWidth() > that.root.width()) {
          slide.css('width', that.root.width());
        } else {
          slide.css('width', slide.innerWidth() );
        }
        slide.css('left', that.root.width());
        setTimeout(function() {
          that.goToSlide(that.initialSlideNumber);
        }, 0);
      }, 0);
    });
  },
  initTransitions: function(callback) {
    if (this.config.transition === 'opacity') {
      this.slides.css({
        'opacity': 0,
        'transition': 'opacity ' + this.config.transitionDuration + 'ms ease-in-out'
      });
    } else if (this.config.transition === 'slide-flex') {
      this.slides.css({
        'display': 'none'
      });
    }
  },
  transition: function(prev, next, forward) {
    if (!prev) {
      prev = {
        css: function() {},
        attr: function() {},
        innerWidth: function() {},
        outerHeight: function() {},
        attr: function() {}
      };
    }
    console.log(prev.attr('data-slide-number'), next.attr('data-slide-number'));

    if (this.config.transition === 'opacity') {
      prev.css('opacity', 0);
      clearTimeout(this.lastTransitionTimeout);
      this.lastTransitionTimeout = setTimeout(function() {
        next.css('opacity', 1);
      }, this.config.transitionDuration);
    } else if (this.config.transition === 'slide-flex') {
      var prevScaleFactor = this.getScaleFactor(prev);
      var nextScaleFactor = this.getScaleFactor(next);
      next.css({'transition': 'none'});
      prev.css({'transition': 'left ' + this.config.transitionDuration + 'ms'});
      if (forward) {
        console.log(nextScaleFactor);
        console.log(this.root.width() + next.innerWidth() * (nextScaleFactor - 1) / 2);
        prev.css({'left': - prev.innerWidth() * ( prevScaleFactor + 1) / 2});
        next.css({'left': this.root.width() + next.innerWidth() * (nextScaleFactor - 1) / 2}); // Pre-position next slide, animation happens further down by normalize().
      } else {
        prev.css({'left': this.root.width() + prev.innerWidth() * (prevScaleFactor - 1) / 2});
        next.css({'left': - next.innerWidth() * ( nextScaleFactor + 1) / 2}); // Pre-position next slide, animation happens further down by normalize().
      }
      setTimeout(function() {
        next.css({'display': 'block', 'transition': 'left ' + this.config.transitionDuration + 'ms'});
        this.normalize(next);
      }.bind(this), 0);
      setTimeout(function() {
        if (this.currentSlide.attr('data-slide-number') !== prev.attr('data-slide-number')) {
          prev.css({'display': 'none', 'transition': 'none'});
        }
      }.bind(this), this.config.transitionDuration);
    }

  },
  getScaleFactor: function(slide) {
    if (!slide[0]) return 1;

    var heightRatio = this.root.height() / slide.outerHeight();
    var widthRatio = this.root.width() / slide.innerWidth();
    var scaleFactor = 1;

    // Scaling leads to flickering and blur on opacity transition in webkit.
    // This can be compensated for by setting backface-visibility: hidden;
    // Although, this gives constant blur.

    // Scaling
    if (slide[0].classList.contains('slide-scaling-superfit')) {
      scaleFactor = Math.min(heightRatio, widthRatio);
    } else if (this.config.scaling === 'fit') {
      scaleFactor = Math.min(heightRatio, widthRatio, 1);
    } else if (this.config.scaling === 'superfit') {
      scaleFactor = Math.min(heightRatio, widthRatio);
    }

    return scaleFactor;
  },
  normalize: function(slide) {
    // return;
    if (!slide) { slide = this.currentSlide; }
    if (!slide) return;
    // Recalculate current slides scaling and position to fit viewport dimensions.

    var scaleFactor = this.getScaleFactor(slide);
    slide.css('transform', 'scale(' + scaleFactor + ')');

    // Remember that, in the calculations below, scaling happens relative to the center of the element.

    // Vertical position
    // Subtract one from top position to avoid flickering scrollbar.
    if (this.config.valign === 'top') {
      slide.css('top', slide.outerHeight() * (scaleFactor - 1) / 2 - 1);
    } else if (this.config.valign === 'center') {
      slide.css('top', (this.root.height() - slide.outerHeight()) / 2 - 1);
    } else if (this.config.valign === 'bottom') {
      slide.css('bottom', slide.outerHeight() * (scaleFactor - 1) / 2);
    }

    // Horizontal position
    if (this.config.halign === 'left') {
      slide.css('left', slide.innerWidth() * (scaleFactor - 1 ) / 2);
    } else if (this.config.halign === 'center') {
      slide.css('left', (this.root.width() - slide.innerWidth()) / 2);
    } else if (this.config.halign === 'right') {
      slide.css('right', slide.innerWidth() * (scaleFactor - 1) / 2);
    }

    return scaleFactor;
  },
  initEvents: function() {
    $(window).resize(function() { this.normalize(); }.bind(this));
    $(window).on('hashchange', function() { this.goToSlide(parseInt(window.location.hash.substr(1))); }.bind(this));
    $(window).keydown(function(e) { // It would be nice to bind keydown to this.root, but this requires the element to be focusabe, and making it so is ugly.
      switch(e.keyCode) {
        // Previous
        case 33: // pg up
        case 37: // left
        // case 38: // up
        case 83: // s
          api.prev();
          e.preventDefault();
          break;
        // Next
        case 32: // space
        case 34: // pg down
        case 39: // right
        // case 40: // down
        case 70: // f
          api.next();
          e.preventDefault();
          break;
        // Toggle cursor
        case 67: // c
          if ($('html').css('cursor') === 'none') {
            $('html').css('cursor', 'url(http://blog.ginchen.de/wp-content/uploads/2009/08/gdlib-png/) 10 10, default');
          } else {
            $('html').css('cursor', 'none');
          }
      }
    });
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
      this.initialSlideNumber = 1;
      if (window.location.hash) {
        this.initialSlideNumber = parseInt(window.location.hash.substr(1));
      }
      setTimeout(this.normalize.bind(this), 100); // Useful if webfonts are loading slowly.
      // this.recalculate(function() {
        this.initTransitions();
        // this.goToSlide(initialSlideNumber);
        this.normalize();
        callback();
      // }.bind(this));
      this.initEvents();
    }.bind(this));
  }
};
