var slides = {
  // Customize these before calling init().
  rootSelector: '.slides', // Where all slides elements (<div>s) are to be found.
  transitionDuration: 500, // Time in milliseconds for slide transition. Set to 0 for no fancy.
  maxWidth: 800, // Max width of each slide.
  status: true, // Show/hide slide current slide (and fragment) number in bottom right corner.
  // Internal stuff.
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
        // callback(eventArgs);
        callback.apply(this, eventArgs);
      }.bind(this));
    }
  },
  // Reveal previous fragment or go to next slide.
  prev: function() {
    if (this.currentFragmentNumber > 0) {
      this.goToFragment(this.currentFragmentNumber - 1);
    } else {
      this.goToSlide(this.currentSlideNumber - 1);
    }
  },
  // Reveal next fragment or go to next slide.
  next: function() {
    if (this.currentFragmentNumber < this.numberOfFragmentsInCurrentSlide) {
      this.goToFragment(this.currentFragmentNumber + 1);
    } else {
      this.goToSlide(this.currentSlideNumber + 1);
    }
  },
  goToFragment: function(n) {
    if (n > this.currentFragmentNumber) {
      this.currentSlide.querySelector('.fragment:not(.visible)').classList.add('visible');
    } else {
      var visibleFragments = this.currentSlide.querySelectorAll('.fragment.visible');
      visibleFragments[visibleFragments.length - 1].classList.remove('visible');
    }
    this.currentFragmentNumber = this.currentSlide.querySelectorAll('.fragment.visible').length;
    this.trigger('fragmentChange');
  },
  goToSlide: function(n) {
    // Do not go past fisrt slide.
    if (this.currentSlideNumber === 1 && n < 1) return;
    // Do not go past last slide.
    if (this.currentSlideNumber === this.slides.length && n > this.slides.length) return;
    // Go to first slide if n is out of range.
    if (n < 1 || n > this.slides.length) n = 1;

    var prevSlideNumber = this.currentSlideNumber;
    var prevSlide = this.currentSlide;
    this.currentSlideNumber = n;
    this.currentSlide = this.slides[n-1];
    window.location.hash = n;
    this.transitionToSlide(prevSlide, this.currentSlide, prevSlideNumber,this.currentSlideNumber);
    // If going backwards, make sure all fragments are visible.
    if (this.currentSlideNumber < prevSlideNumber) {
      Array.prototype.forEach.call(this.currentSlide.querySelectorAll('.fragment'), function(fragment) {
        fragment.classList.add('visible');
      });
    }
    this.numberOfFragmentsInCurrentSlide = this.currentSlide.querySelectorAll('.fragment').length;
    this.currentFragmentNumber = this.currentSlide.querySelectorAll('.fragment.visible').length;
    this.trigger('slideChange');
  },
  transitionToSlide: function(prev, next, prevNumber, nextNumber) {
    if (!prev) {
      prev = {
        style: function() {},
      };
    }
    if (prevNumber < nextNumber) {
      prev.style.left = (- prev.clientWidth * ( prev.___scaleFactor + 1) / 2) + 'px';
    } else {
      prev.style.left = (this.root.clientWidth + prev.clientWidth * (prev.___scaleFactor - 1) / 2) + 'px';
    }
    next.style.top = (next.clientHeight * (next.___scaleFactor - 1) / 2) + 'px';
    next.style.left = (this.root.clientWidth - next.clientWidth) / 2 + 'px';
  },
  initSlides: function() {
    var width = Math.min(this.root.clientWidth, this.maxWidth);
    Array.prototype.forEach.call(this.slides, function(slide, idx) {
      var n = idx + 1;
      slide.style.position = 'absolute';
      slide.style.left = '0px';
      slide.style.top = '0px';
      slide.style.width = width + 'px';
      var scaleFactor = Math.min(this.root.clientHeight / slide.clientHeight, 1);
      slide.___scaleFactor = scaleFactor;
      slide.style.transform = 'scale(' + scaleFactor + ')';
      slide.style.top = (slide.clientHeight * (scaleFactor - 1) / 2) + 'px';
      if (n < this.currentSlideNumber) {
        slide.style.left = (- slide.clientWidth * ( slide.___scaleFactor + 1) / 2) + 'px';
      } else {
        slide.style.left = (this.root.clientWidth + slide.clientWidth * (slide.___scaleFactor - 1) / 2) + 'px';
      }
      slide.style.transition = 'left ' + this.transitionDuration + 'ms';
    }.bind(this));
    this.goToSlide(this.currentSlideNumber);
  },
  initEvents: function() {
    window.addEventListener('resize', function() {
      this.initSlides();
    }.bind(this));
    window.addEventListener('hashchange', function() {
      var hashNumber = parseInt(window.location.hash.substr(1));
      if (hashNumber !== this.currentSlideNumber) {
        this.goToSlide(parseInt(window.location.hash.substr(1)));
      }
    }.bind(this));
    window.addEventListener('keydown', function(e) { // It would be nice to bind keydown to this.root, but this requires the element to be focusabe, and making it so is ugly.
      //           page up                left                   s                      shift + space
      if (e.keyCode === 33 || e.keyCode === 37 || e.keyCode === 83 || (e.shiftKey && e.keyCode === 32)) {
        this.prev();
        e.preventDefault();
      //                page down               right                   f               space               enter
      } else if (e.keyCode === 34 || e.keyCode === 39 || e.keyCode === 70 || e.keyCode === 32 || e.keyCode === 13) {
        this.next();
        e.preventDefault();
      //                        c
      } else if (e.keyCode === 67) {
        // if ($('html').css('cursor') === 'none') {
        //   $('html').css('cursor', 'url(http://blog.ginchen.de/wp-content/uploads/2009/08/gdlib-png/) 10 10, default');
        // } else {
        //   $('html').css('cursor', 'none');
        // }
      }
    }.bind(this));

  },
  initStatus: function() {
    if (!this.status) return;
    var status = document.createElement('span');
    var slideStatus = document.createElement('span');
    var fragmentStatus = document.createElement('span');

    status.classList.add('status');
    status.appendChild(fragmentStatus);
    status.appendChild(slideStatus);
    this.root.appendChild(status);

    status.style['font-size'] = '20px';
    status.style.position = 'absolute';
    status.style.bottom = '0px';
    status.style.right = '0px';
    status.style.color = '#aaa';

    this.on('slideChange', function() {
      slideStatus.textContent = this.currentSlideNumber + '/' + this.slides.length;
      if (this.numberOfFragmentsInCurrentSlide === 0) {
        fragmentStatus.style.display = 'none';
      } else {
        fragmentStatus.style.display = '';
        fragmentStatus.textContent = this.currentFragmentNumber + '/' + this.numberOfFragmentsInCurrentSlide + ' ';
      }
    });
    this.on('fragmentChange', function() {
      fragmentStatus.textContent = this.currentFragmentNumber + '/' + this.numberOfFragmentsInCurrentSlide + ' ';
    });
  },
  init: function(callback) {
    // Make sure that init can be called both before and after DOM has loaded.
    var wrapper = function() {
      this.root = document.querySelector(this.rootSelector);
      this.root.style.overflow = 'hidden';
      this.slides = document.querySelectorAll(this.rootSelector + '>div');
      this.initStatus();
      this.initEvents();
      if (window.location.hash) {
        this.currentSlideNumber = parseInt(window.location.hash.substr(1));
      } else {
        this.currentSlideNumber = 1;
      }
      this.initSlides();
      if (callback) callback();
    }.bind(this);
    if (document.readyState === 'complete') {
      wrapper();
    } else {
      document.addEventListener('DOMContentLoaded', wrapper);
    }
  }
};
