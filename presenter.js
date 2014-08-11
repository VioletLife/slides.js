/* jshint browser:true */
/* global $:true */

var api = {
  slides: null, // populated by init()
  currentSlideNumber: 1,
  prev: function() {
    var lastVisibleFragment = this.currentSlide.find('.fragment.fragment-visible').last().removeClass('fragment-visible');
    if (!lastVisibleFragment.length) this.goToSlide(this.currentSlideNumber - 1);
  },
  next: function() {
    var firstHiddenFragment = this.currentSlide.find('.fragment:not(.fragment-visible)').first().addClass('fragment-visible');
    if (!firstHiddenFragment.length) this.goToSlide(this.currentSlideNumber + 1);
  },
  goToSlide: function(n) {
    if ((n <= this.slides.length) && (n >= 1)) {
      this.currentSlideNumber = n;
      if (this.currentSlide) this.currentSlide.removeClass('active');
      this.currentSlide = this.getSlide(n);
      this.currentSlide.addClass('active');
      this.resizeCurrentSlide();
    }
  },
  getSlide: function(n) {
    return this.slides.filter('[data-slide-number="' + n + '"]');
  },
  resizeCurrentSlide: function() {
    var scaleFactor = Math.min($(window).height() / this.currentSlide.outerHeight(), $(window).width() / this.currentSlide.outerWidth());
    this.currentSlide.css({
      // transform: 'scale(' + (scaleFactor < 1 ? scaleFactor : 1) + ')',
      transform: 'scale(' + scaleFactor + ')',
      top: Math.floor(($(window).height() - this.currentSlide.outerHeight()) / 2),
      left: Math.floor(($(window).width() - this.currentSlide.outerWidth()) / 2),
    });
  },
  init: function(selector) {
    this.slides = $(selector || '.slides').children('.slide');
    this.slides.each(function(idx) {
      $(this).attr('data-slide-number', idx+1);
    });
    this.goToSlide(this.currentSlideNumber);
    this.resizeCurrentSlide();
    setTimeout(this.resizeCurrentSlide.bind(this), 100); // Useful if webfonts are loading slowly.
    $(window).resize(this.resizeCurrentSlide.bind(this));
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
            $('html').css('cursor', 'default');
          } else {
            $('html').css('cursor', 'none');
          }
      }
    });
  }
};

$(function() {
  api.init();
});
