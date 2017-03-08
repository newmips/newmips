
/*!
FullCalendar Scheduler v1.5.1
Docs & License: https://fullcalendar.io/scheduler/
(c) 2017 Adam Shaw
 */
(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'jquery', 'moment', 'fullcalendar' ], factory);
	}
	else if (typeof exports === 'object') { // Node/CommonJS
		module.exports = factory(
			require('jquery'),
			require('moment'),
			require('fullcalendar')
		);
	}
	else {
		factory(jQuery, moment);
	}
})(function($, moment) {;
var COL_MIN_WIDTH, Calendar, CalendarExtension, Class, ClippedScroller, CoordCache, DEFAULT_GRID_DURATION, DragListener, EmitterMixin, EnhancedScroller, EventRow, FC, Grid, HRowGroup, LICENSE_INFO_URL, ListenerMixin, MAX_AUTO_CELLS, MAX_AUTO_SLOTS_PER_LABEL, MAX_CELLS, MIN_AUTO_LABELS, PRESET_LICENSE_KEYS, Promise, RELEASE_DATE, ResourceAgendaView, ResourceBasicView, ResourceDayGrid, ResourceDayTableMixin, ResourceGridMixin, ResourceManager, ResourceMonthView, ResourceRow, ResourceTimeGrid, ResourceTimelineGrid, ResourceTimelineView, ResourceViewMixin, RowGroup, RowParent, STOCK_SUB_DURATIONS, ScrollFollower, ScrollFollowerSprite, ScrollJoiner, ScrollerCanvas, Spreadsheet, TaskQueue, TimelineGrid, TimelineView, UPGRADE_WINDOW, VRowGroup, VertResourceViewMixin, View, _filterResourcesWithEvents, applyAll, capitaliseFirstLetter, compareByFieldSpecs, computeIntervalUnit, computeOffsetForSeg, computeOffsetForSegs, copyRect, createObject, cssToStr, debounce, detectWarningInContainer, divideDurationByDuration, divideRangeByDuration, durationHasTime, flexibleCompare, getContentRect, getOuterRect, getOwnCells, getRectHeight, getRectWidth, getScrollbarWidths, hContainRect, htmlEscape, intersectRanges, intersectRects, isImmuneUrl, isInt, isValidKey, joinRects, multiplyDuration, origExecuteEventsRender, origGetSegCustomClasses, origGetSegDefaultBackgroundColor, origGetSegDefaultBorderColor, origGetSegDefaultTextColor, origHandleDate, origOnDateRender, origRemoveElement, origSetElement, parseFieldSpecs, processLicenseKey, proxy, renderingWarningInContainer, testRectContains, testRectHContains, testRectVContains, timeRowSegsCollide, vContainRect,
  extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
  hasProp = {}.hasOwnProperty,
  indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
  slice = [].slice;

FC = $.fullCalendar;

FC.schedulerVersion = "1.5.1";

if (FC.internalApiVersion !== 8) {
  FC.warn('v' + FC.schedulerVersion + ' of FullCalendar Scheduler ' + 'is incompatible with v' + FC.version + ' of the core.\n' + 'Please see http://fullcalendar.io/support/ for more information.');
  return;
}

Calendar = FC.Calendar;

Class = FC.Class;

View = FC.View;

Grid = FC.Grid;

intersectRanges = FC.intersectRanges;

debounce = FC.debounce;

isInt = FC.isInt;

getScrollbarWidths = FC.getScrollbarWidths;

DragListener = FC.DragListener;

htmlEscape = FC.htmlEscape;

computeIntervalUnit = FC.computeIntervalUnit;

proxy = FC.proxy;

capitaliseFirstLetter = FC.capitaliseFirstLetter;

applyAll = FC.applyAll;

EmitterMixin = FC.EmitterMixin;

ListenerMixin = FC.ListenerMixin;

durationHasTime = FC.durationHasTime;

divideRangeByDuration = FC.divideRangeByDuration;

divideDurationByDuration = FC.divideDurationByDuration;

multiplyDuration = FC.multiplyDuration;

parseFieldSpecs = FC.parseFieldSpecs;

compareByFieldSpecs = FC.compareByFieldSpecs;

flexibleCompare = FC.flexibleCompare;

intersectRects = FC.intersectRects;

CoordCache = FC.CoordCache;

getContentRect = FC.getContentRect;

getOuterRect = FC.getOuterRect;

createObject = FC.createObject;

Promise = FC.Promise;

TaskQueue = FC.TaskQueue;


/*
Given a jQuery <tr> set, returns the <td>'s that do not have multi-line rowspans.
Would use the [rowspan] selector, but never not defined in IE8.
 */

getOwnCells = function(trs) {
  return trs.find('> td').filter(function(i, tdNode) {
    return tdNode.rowSpan <= 1;
  });
};


/*
A Scroller with additional functionality:
- optional ScrollerCanvas for content
- fired events for scroll start/end
- cross-browser normalization of horizontal scroll for RTL
 */

EnhancedScroller = (function(superClass) {
  var detectRtlScrollSystem, rtlScrollSystem;

  extend(EnhancedScroller, superClass);

  EnhancedScroller.mixin(EmitterMixin);

  EnhancedScroller.mixin(ListenerMixin);

  EnhancedScroller.prototype.canvas = null;

  EnhancedScroller.prototype.isScrolling = false;

  EnhancedScroller.prototype.isTouching = false;

  EnhancedScroller.prototype.isMoving = false;

  EnhancedScroller.prototype.isTouchScrollEnabled = true;

  EnhancedScroller.prototype.preventTouchScrollHandler = null;

  function EnhancedScroller() {
    EnhancedScroller.__super__.constructor.apply(this, arguments);
    this.requestMovingEnd = debounce(this.reportMovingEnd, 500);
  }

  EnhancedScroller.prototype.render = function() {
    EnhancedScroller.__super__.render.apply(this, arguments);
    if (this.canvas) {
      this.canvas.render();
      this.canvas.el.appendTo(this.scrollEl);
    }
    return this.bindHandlers();
  };

  EnhancedScroller.prototype.destroy = function() {
    EnhancedScroller.__super__.destroy.apply(this, arguments);
    return this.unbindHandlers();
  };

  EnhancedScroller.prototype.disableTouchScroll = function() {
    this.isTouchScrollEnabled = false;
    return this.bindPreventTouchScroll();
  };

  EnhancedScroller.prototype.enableTouchScroll = function() {
    this.isTouchScrollEnabled = true;
    if (!this.isTouching) {
      return this.unbindPreventTouchScroll();
    }
  };

  EnhancedScroller.prototype.bindPreventTouchScroll = function() {
    if (!this.preventTouchScrollHandler) {
      return this.scrollEl.on('touchmove', this.preventTouchScrollHandler = FC.preventDefault);
    }
  };

  EnhancedScroller.prototype.unbindPreventTouchScroll = function() {
    if (this.preventTouchScrollHandler) {
      this.scrollEl.off('touchmove', this.preventTouchScrollHandler);
      return this.preventTouchScrollHandler = null;
    }
  };

  EnhancedScroller.prototype.bindHandlers = function() {
    return this.listenTo(this.scrollEl, {
      scroll: this.reportScroll,
      touchstart: this.reportTouchStart,
      touchend: this.reportTouchEnd
    });
  };

  EnhancedScroller.prototype.unbindHandlers = function() {
    return this.stopListeningTo(this.scrollEl);
  };

  EnhancedScroller.prototype.reportScroll = function() {
    if (!this.isScrolling) {
      this.reportScrollStart();
    }
    this.trigger('scroll');
    this.isMoving = true;
    return this.requestMovingEnd();
  };

  EnhancedScroller.prototype.reportScrollStart = function() {
    if (!this.isScrolling) {
      this.isScrolling = true;
      return this.trigger('scrollStart', this.isTouching);
    }
  };

  EnhancedScroller.prototype.requestMovingEnd = null;

  EnhancedScroller.prototype.reportMovingEnd = function() {
    this.isMoving = false;
    if (!this.isTouching) {
      return this.reportScrollEnd();
    }
  };

  EnhancedScroller.prototype.reportScrollEnd = function() {
    if (this.isScrolling) {
      this.trigger('scrollEnd');
      return this.isScrolling = false;
    }
  };

  EnhancedScroller.prototype.reportTouchStart = function() {
    return this.isTouching = true;
  };

  EnhancedScroller.prototype.reportTouchEnd = function() {
    if (this.isTouching) {
      this.isTouching = false;
      if (this.isTouchScrollEnabled) {
        this.unbindPreventTouchScroll();
      }
      if (!this.isMoving) {
        return this.reportScrollEnd();
      }
    }
  };


  /*
  	If RTL, and scrolled to the left, returns NEGATIVE value (like Firefox)
   */

  EnhancedScroller.prototype.getScrollLeft = function() {
    var direction, node, val;
    direction = this.scrollEl.css('direction');
    node = this.scrollEl[0];
    val = node.scrollLeft;
    if (direction === 'rtl') {
      switch (rtlScrollSystem) {
        case 'positive':
          val = val + node.clientWidth - node.scrollWidth;
          break;
        case 'reverse':
          val = -val;
      }
    }
    return val;
  };


  /*
  	Accepts a NEGATIVE value for when scrolled in RTL
   */

  EnhancedScroller.prototype.setScrollLeft = function(val) {
    var direction, node;
    direction = this.scrollEl.css('direction');
    node = this.scrollEl[0];
    if (direction === 'rtl') {
      switch (rtlScrollSystem) {
        case 'positive':
          val = val - node.clientWidth + node.scrollWidth;
          break;
        case 'reverse':
          val = -val;
      }
    }
    return node.scrollLeft = val;
  };


  /*
  	Always returns the number of pixels scrolled from the leftmost position (even if RTL).
  	Always positive.
   */

  EnhancedScroller.prototype.getScrollFromLeft = function() {
    var direction, node, val;
    direction = this.scrollEl.css('direction');
    node = this.scrollEl[0];
    val = node.scrollLeft;
    if (direction === 'rtl') {
      switch (rtlScrollSystem) {
        case 'negative':
          val = val - node.clientWidth + node.scrollWidth;
          break;
        case 'reverse':
          val = -val - node.clientWidth + node.scrollWidth;
      }
    }
    return val;
  };

  EnhancedScroller.prototype.getNativeScrollLeft = function() {
    return this.scrollEl[0].scrollLeft;
  };

  EnhancedScroller.prototype.setNativeScrollLeft = function(val) {
    return this.scrollEl[0].scrollLeft = val;
  };

  rtlScrollSystem = null;

  detectRtlScrollSystem = function() {
    var el, node, system;
    el = $('<div style=" position: absolute top: -1000px; width: 1px; height: 1px; overflow: scroll; direction: rtl; font-size: 14px; ">A</div>').appendTo('body');
    node = el[0];
    system = node.scrollLeft > 0 ? 'positive' : (node.scrollLeft = 1, el.scrollLeft > 0 ? 'reverse' : 'negative');
    el.remove();
    return system;
  };

  $(function() {
    return rtlScrollSystem = detectRtlScrollSystem();
  });

  return EnhancedScroller;

})(FC.Scroller);


/*
A Scroller, but with a wrapping div that allows "clipping" away of native scrollbars,
giving the appearance that there are no scrollbars.
 */

ClippedScroller = (function(superClass) {
  extend(ClippedScroller, superClass);

  ClippedScroller.prototype.isHScrollbarsClipped = false;

  ClippedScroller.prototype.isVScrollbarsClipped = false;


  /*
  	Received overflows can be set to 'clipped', meaning scrollbars shouldn't be visible
  	to the user, but the area should still scroll.
   */

  function ClippedScroller() {
    ClippedScroller.__super__.constructor.apply(this, arguments);
    if (this.overflowX === 'clipped-scroll') {
      this.overflowX = 'scroll';
      this.isHScrollbarsClipped = true;
    }
    if (this.overflowY === 'clipped-scroll') {
      this.overflowY = 'scroll';
      this.isVScrollbarsClipped = true;
    }
  }

  ClippedScroller.prototype.renderEl = function() {
    var scrollEl;
    scrollEl = ClippedScroller.__super__.renderEl.apply(this, arguments);
    return $('<div class="fc-scroller-clip" />').append(scrollEl);
  };

  ClippedScroller.prototype.updateSize = function() {
    var cssProps, scrollEl, scrollbarWidths;
    scrollEl = this.scrollEl;
    scrollbarWidths = getScrollbarWidths(scrollEl);
    cssProps = {
      marginLeft: 0,
      marginRight: 0,
      marginTop: 0,
      marginBottom: 0
    };
    if (this.isHScrollbarsClipped) {
      cssProps.marginTop = -scrollbarWidths.top;
      cssProps.marginBottom = -scrollbarWidths.bottom;
    }
    if (this.isVScrollbarsClipped) {
      cssProps.marginLeft = -scrollbarWidths.left;
      cssProps.marginRight = -scrollbarWidths.right;
    }
    scrollEl.css(cssProps);
    return scrollEl.toggleClass('fc-no-scrollbars', (this.isHScrollbarsClipped || this.overflowX === 'hidden') && (this.isVScrollbarsClipped || this.overflowY === 'hidden') && !(scrollbarWidths.top || scrollbarWidths.bottom || scrollbarWidths.left || scrollbarWidths.right));
  };


  /*
  	Accounts for 'clipped' scrollbars
   */

  ClippedScroller.prototype.getScrollbarWidths = function() {
    var widths;
    widths = getScrollbarWidths(this.scrollEl);
    if (this.isHScrollbarsClipped) {
      widths.top = 0;
      widths.bottom = 0;
    }
    if (this.isVScrollbarsClipped) {
      widths.left = 0;
      widths.right = 0;
    }
    return widths;
  };

  return ClippedScroller;

})(EnhancedScroller);


/*
A rectangular area of content that lives within a Scroller.
Can have "gutters", areas of dead spacing around the perimeter.
Also very useful for forcing a width, which a Scroller cannot do alone.
Has a content area that lives above a background area.
 */

ScrollerCanvas = (function() {
  ScrollerCanvas.prototype.el = null;

  ScrollerCanvas.prototype.contentEl = null;

  ScrollerCanvas.prototype.bgEl = null;

  ScrollerCanvas.prototype.gutters = null;

  ScrollerCanvas.prototype.width = null;

  ScrollerCanvas.prototype.minWidth = null;

  function ScrollerCanvas() {
    this.gutters = {};
  }

  ScrollerCanvas.prototype.render = function() {
    this.el = $('<div class="fc-scroller-canvas"> <div class="fc-content"></div> <div class="fc-bg"></div> </div>');
    this.contentEl = this.el.find('.fc-content');
    return this.bgEl = this.el.find('.fc-bg');
  };


  /*
  	If falsy, resets all the gutters to 0
   */

  ScrollerCanvas.prototype.setGutters = function(gutters) {
    if (!gutters) {
      this.gutters = {};
    } else {
      $.extend(this.gutters, gutters);
    }
    return this.updateSize();
  };

  ScrollerCanvas.prototype.setWidth = function(width1) {
    this.width = width1;
    return this.updateSize();
  };

  ScrollerCanvas.prototype.setMinWidth = function(minWidth1) {
    this.minWidth = minWidth1;
    return this.updateSize();
  };

  ScrollerCanvas.prototype.clearWidth = function() {
    this.width = null;
    this.minWidth = null;
    return this.updateSize();
  };

  ScrollerCanvas.prototype.updateSize = function() {
    var gutters;
    gutters = this.gutters;
    this.el.toggleClass('fc-gutter-left', Boolean(gutters.left)).toggleClass('fc-gutter-right', Boolean(gutters.right)).toggleClass('fc-gutter-top', Boolean(gutters.top)).toggleClass('fc-gutter-bottom', Boolean(gutters.bottom)).css({
      paddingLeft: gutters.left || '',
      paddingRight: gutters.right || '',
      paddingTop: gutters.top || '',
      paddingBottom: gutters.bottom || '',
      width: this.width != null ? this.width + (gutters.left || 0) + (gutters.right || 0) : '',
      minWidth: this.minWidth != null ? this.minWidth + (gutters.left || 0) + (gutters.right || 0) : ''
    });
    return this.bgEl.css({
      left: gutters.left || '',
      right: gutters.right || '',
      top: gutters.top || '',
      bottom: gutters.bottom || ''
    });
  };

  return ScrollerCanvas;

})();

ScrollJoiner = (function() {
  ScrollJoiner.prototype.axis = null;

  ScrollJoiner.prototype.scrollers = null;

  ScrollJoiner.prototype.masterScroller = null;

  function ScrollJoiner(axis, scrollers) {
    var j, len, ref, scroller;
    this.axis = axis;
    this.scrollers = scrollers;
    ref = this.scrollers;
    for (j = 0, len = ref.length; j < len; j++) {
      scroller = ref[j];
      this.initScroller(scroller);
    }
    return;
  }

  ScrollJoiner.prototype.initScroller = function(scroller) {
    scroller.scrollEl.on('wheel mousewheel DomMouseScroll MozMousePixelScroll', (function(_this) {
      return function() {
        _this.assignMasterScroller(scroller);
      };
    })(this));
    return scroller.on('scrollStart', (function(_this) {
      return function() {
        if (!_this.masterScroller) {
          return _this.assignMasterScroller(scroller);
        }
      };
    })(this)).on('scroll', (function(_this) {
      return function() {
        var j, len, otherScroller, ref, results;
        if (scroller === _this.masterScroller) {
          ref = _this.scrollers;
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            otherScroller = ref[j];
            if (otherScroller !== scroller) {
              switch (_this.axis) {
                case 'horizontal':
                  results.push(otherScroller.setNativeScrollLeft(scroller.getNativeScrollLeft()));
                  break;
                case 'vertical':
                  results.push(otherScroller.setScrollTop(scroller.getScrollTop()));
                  break;
                default:
                  results.push(void 0);
              }
            } else {
              results.push(void 0);
            }
          }
          return results;
        }
      };
    })(this)).on('scrollEnd', (function(_this) {
      return function() {
        if (scroller === _this.masterScroller) {
          return _this.unassignMasterScroller();
        }
      };
    })(this));
  };

  ScrollJoiner.prototype.assignMasterScroller = function(scroller) {
    var j, len, otherScroller, ref;
    this.unassignMasterScroller();
    this.masterScroller = scroller;
    ref = this.scrollers;
    for (j = 0, len = ref.length; j < len; j++) {
      otherScroller = ref[j];
      if (otherScroller !== scroller) {
        otherScroller.disableTouchScroll();
      }
    }
  };

  ScrollJoiner.prototype.unassignMasterScroller = function() {
    var j, len, otherScroller, ref;
    if (this.masterScroller) {
      ref = this.scrollers;
      for (j = 0, len = ref.length; j < len; j++) {
        otherScroller = ref[j];
        otherScroller.enableTouchScroll();
      }
      this.masterScroller = null;
    }
  };

  ScrollJoiner.prototype.update = function() {
    var allWidths, i, j, k, len, len1, maxBottom, maxLeft, maxRight, maxTop, ref, scroller, widths;
    allWidths = (function() {
      var j, len, ref, results;
      ref = this.scrollers;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        scroller = ref[j];
        results.push(scroller.getScrollbarWidths());
      }
      return results;
    }).call(this);
    maxLeft = maxRight = maxTop = maxBottom = 0;
    for (j = 0, len = allWidths.length; j < len; j++) {
      widths = allWidths[j];
      maxLeft = Math.max(maxLeft, widths.left);
      maxRight = Math.max(maxRight, widths.right);
      maxTop = Math.max(maxTop, widths.top);
      maxBottom = Math.max(maxBottom, widths.bottom);
    }
    ref = this.scrollers;
    for (i = k = 0, len1 = ref.length; k < len1; i = ++k) {
      scroller = ref[i];
      widths = allWidths[i];
      scroller.canvas.setGutters(this.axis === 'horizontal' ? {
        left: maxLeft - widths.left,
        right: maxRight - widths.right
      } : {
        top: maxTop - widths.top,
        bottom: maxBottom - widths.bottom
      });
    }
  };

  return ScrollJoiner;

})();

ScrollFollower = (function() {
  ScrollFollower.prototype.scroller = null;

  ScrollFollower.prototype.scrollbarWidths = null;

  ScrollFollower.prototype.sprites = null;

  ScrollFollower.prototype.viewportRect = null;

  ScrollFollower.prototype.contentOffset = null;

  ScrollFollower.prototype.isHFollowing = true;

  ScrollFollower.prototype.isVFollowing = false;

  ScrollFollower.prototype.allowPointerEvents = false;

  ScrollFollower.prototype.containOnNaturalLeft = false;

  ScrollFollower.prototype.containOnNaturalRight = false;

  ScrollFollower.prototype.minTravel = 0;

  ScrollFollower.prototype.isTouch = false;

  ScrollFollower.prototype.isForcedRelative = false;

  function ScrollFollower(scroller, allowPointerEvents) {
    this.allowPointerEvents = allowPointerEvents != null ? allowPointerEvents : false;
    this.scroller = scroller;
    this.sprites = [];
    scroller.on('scroll', (function(_this) {
      return function() {
        if (scroller.isTouching) {
          _this.isTouch = true;
          return _this.isForcedRelative = true;
        } else {
          _this.isTouch = false;
          _this.isForcedRelative = false;
          return _this.handleScroll();
        }
      };
    })(this));
    scroller.on('scrollEnd', (function(_this) {
      return function() {
        return _this.handleScroll();
      };
    })(this));
  }

  ScrollFollower.prototype.setSprites = function(sprites) {
    var j, len, sprite;
    this.clearSprites();
    if (sprites instanceof $) {
      return this.sprites = (function() {
        var j, len, results;
        results = [];
        for (j = 0, len = sprites.length; j < len; j++) {
          sprite = sprites[j];
          results.push(new ScrollFollowerSprite($(sprite), this));
        }
        return results;
      }).call(this);
    } else {
      for (j = 0, len = sprites.length; j < len; j++) {
        sprite = sprites[j];
        sprite.follower = this;
      }
      return this.sprites = sprites;
    }
  };

  ScrollFollower.prototype.clearSprites = function() {
    var j, len, ref, sprite;
    ref = this.sprites;
    for (j = 0, len = ref.length; j < len; j++) {
      sprite = ref[j];
      sprite.clear();
    }
    return this.sprites = [];
  };

  ScrollFollower.prototype.handleScroll = function() {
    this.updateViewport();
    return this.updatePositions();
  };

  ScrollFollower.prototype.cacheDimensions = function() {
    var j, len, ref, sprite;
    this.updateViewport();
    this.scrollbarWidths = this.scroller.getScrollbarWidths();
    this.contentOffset = this.scroller.canvas.el.offset();
    ref = this.sprites;
    for (j = 0, len = ref.length; j < len; j++) {
      sprite = ref[j];
      sprite.cacheDimensions();
    }
  };

  ScrollFollower.prototype.updateViewport = function() {
    var left, scroller, top;
    scroller = this.scroller;
    left = scroller.getScrollFromLeft();
    top = scroller.getScrollTop();
    return this.viewportRect = {
      left: left,
      right: left + scroller.getClientWidth(),
      top: top,
      bottom: top + scroller.getClientHeight()
    };
  };

  ScrollFollower.prototype.forceRelative = function() {
    var j, len, ref, results, sprite;
    if (!this.isForcedRelative) {
      this.isForcedRelative = true;
      ref = this.sprites;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        sprite = ref[j];
        if (sprite.doAbsolute) {
          results.push(sprite.assignPosition());
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  };

  ScrollFollower.prototype.clearForce = function() {
    var j, len, ref, results, sprite;
    if (this.isForcedRelative && !this.isTouch) {
      this.isForcedRelative = false;
      ref = this.sprites;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        sprite = ref[j];
        results.push(sprite.assignPosition());
      }
      return results;
    }
  };

  ScrollFollower.prototype.update = function() {
    this.cacheDimensions();
    return this.updatePositions();
  };

  ScrollFollower.prototype.updatePositions = function() {
    var j, len, ref, sprite;
    ref = this.sprites;
    for (j = 0, len = ref.length; j < len; j++) {
      sprite = ref[j];
      sprite.updatePosition();
    }
  };

  ScrollFollower.prototype.getContentRect = function(el) {
    return getContentRect(el, this.contentOffset);
  };

  ScrollFollower.prototype.getBoundingRect = function(el) {
    return getOuterRect(el, this.contentOffset);
  };

  return ScrollFollower;

})();

ScrollFollowerSprite = (function() {
  ScrollFollowerSprite.prototype.follower = null;

  ScrollFollowerSprite.prototype.el = null;

  ScrollFollowerSprite.prototype.absoluteEl = null;

  ScrollFollowerSprite.prototype.naturalRect = null;

  ScrollFollowerSprite.prototype.parentRect = null;

  ScrollFollowerSprite.prototype.containerRect = null;

  ScrollFollowerSprite.prototype.isEnabled = true;

  ScrollFollowerSprite.prototype.isHFollowing = false;

  ScrollFollowerSprite.prototype.isVFollowing = false;

  ScrollFollowerSprite.prototype.doAbsolute = false;

  ScrollFollowerSprite.prototype.isAbsolute = false;

  ScrollFollowerSprite.prototype.isCentered = false;

  ScrollFollowerSprite.prototype.rect = null;

  ScrollFollowerSprite.prototype.isBlock = false;

  ScrollFollowerSprite.prototype.naturalWidth = null;

  function ScrollFollowerSprite(el1, follower1) {
    this.el = el1;
    this.follower = follower1 != null ? follower1 : null;
    this.isBlock = this.el.css('display') === 'block';
    this.el.css('position', 'relative');
  }

  ScrollFollowerSprite.prototype.disable = function() {
    if (this.isEnabled) {
      this.isEnabled = false;
      this.resetPosition();
      return this.unabsolutize();
    }
  };

  ScrollFollowerSprite.prototype.enable = function() {
    if (!this.isEnabled) {
      this.isEnabled = true;
      return this.assignPosition();
    }
  };

  ScrollFollowerSprite.prototype.clear = function() {
    this.disable();
    this.follower = null;
    return this.absoluteEl = null;
  };

  ScrollFollowerSprite.prototype.cacheDimensions = function() {
    var containerRect, follower, isCentered, isHFollowing, isVFollowing, minTravel, naturalRect, parentEl;
    isHFollowing = false;
    isVFollowing = false;
    isCentered = false;
    this.naturalWidth = this.el.width();
    this.resetPosition();
    follower = this.follower;
    naturalRect = this.naturalRect = follower.getBoundingRect(this.el);
    parentEl = this.el.parent();
    this.parentRect = follower.getBoundingRect(parentEl);
    containerRect = this.containerRect = joinRects(follower.getContentRect(parentEl), naturalRect);
    minTravel = follower.minTravel;
    if (follower.containOnNaturalLeft) {
      containerRect.left = naturalRect.left;
    }
    if (follower.containOnNaturalRight) {
      containerRect.right = naturalRect.right;
    }
    if (follower.isHFollowing) {
      if (getRectWidth(containerRect) - getRectWidth(naturalRect) >= minTravel) {
        isCentered = this.el.css('text-align') === 'center';
        isHFollowing = true;
      }
    }
    if (follower.isVFollowing) {
      if (getRectHeight(containerRect) - getRectHeight(naturalRect) >= minTravel) {
        isVFollowing = true;
      }
    }
    this.isHFollowing = isHFollowing;
    this.isVFollowing = isVFollowing;
    return this.isCentered = isCentered;
  };

  ScrollFollowerSprite.prototype.updatePosition = function() {
    this.computePosition();
    return this.assignPosition();
  };

  ScrollFollowerSprite.prototype.resetPosition = function() {
    return this.el.css({
      top: '',
      left: ''
    });
  };

  ScrollFollowerSprite.prototype.computePosition = function() {
    var containerRect, doAbsolute, parentRect, rect, rectWidth, subjectRect, viewportRect, visibleParentRect;
    viewportRect = this.follower.viewportRect;
    parentRect = this.parentRect;
    containerRect = this.containerRect;
    visibleParentRect = intersectRects(viewportRect, parentRect);
    rect = null;
    doAbsolute = false;
    if (visibleParentRect) {
      rect = copyRect(this.naturalRect);
      subjectRect = intersectRects(rect, parentRect);
      if ((this.isCentered && !testRectContains(viewportRect, parentRect)) || (subjectRect && !testRectContains(viewportRect, subjectRect))) {
        doAbsolute = true;
        if (this.isHFollowing) {
          if (this.isCentered) {
            rectWidth = getRectWidth(rect);
            rect.left = (visibleParentRect.left + visibleParentRect.right) / 2 - rectWidth / 2;
            rect.right = rect.left + rectWidth;
          } else {
            if (!hContainRect(rect, viewportRect)) {
              doAbsolute = false;
            }
          }
          if (hContainRect(rect, containerRect)) {
            doAbsolute = false;
          }
        }
        if (this.isVFollowing) {
          if (!vContainRect(rect, viewportRect)) {
            doAbsolute = false;
          }
          if (vContainRect(rect, containerRect)) {
            doAbsolute = false;
          }
        }
        if (!testRectContains(viewportRect, rect)) {
          doAbsolute = false;
        }
      }
    }
    this.rect = rect;
    return this.doAbsolute = doAbsolute;
  };

  ScrollFollowerSprite.prototype.assignPosition = function() {
    var left, top;
    if (this.isEnabled) {
      if (!this.rect) {
        return this.unabsolutize();
      } else if (this.doAbsolute && !this.follower.isForcedRelative) {
        this.absolutize();
        return this.absoluteEl.css({
          top: this.rect.top - this.follower.viewportRect.top + this.follower.scrollbarWidths.top,
          left: this.rect.left - this.follower.viewportRect.left + this.follower.scrollbarWidths.left,
          width: this.isBlock ? this.naturalWidth : ''
        });
      } else {
        top = this.rect.top - this.naturalRect.top;
        left = this.rect.left - this.naturalRect.left;
        this.unabsolutize();
        return this.el.toggleClass('fc-following', Boolean(top || left)).css({
          top: top,
          left: left
        });
      }
    }
  };

  ScrollFollowerSprite.prototype.absolutize = function() {
    if (!this.isAbsolute) {
      if (!this.absoluteEl) {
        this.absoluteEl = this.buildAbsoluteEl();
      }
      this.absoluteEl.appendTo(this.follower.scroller.el);
      this.el.css('visibility', 'hidden');
      return this.isAbsolute = true;
    }
  };

  ScrollFollowerSprite.prototype.unabsolutize = function() {
    if (this.isAbsolute) {
      this.absoluteEl.detach();
      this.el.css('visibility', '');
      return this.isAbsolute = false;
    }
  };

  ScrollFollowerSprite.prototype.buildAbsoluteEl = function() {
    var el;
    el = this.el.clone().addClass('fc-following');
    el.css({
      'position': 'absolute',
      'z-index': 1000,
      'font-weight': this.el.css('font-weight'),
      'font-size': this.el.css('font-size'),
      'font-family': this.el.css('font-family'),
      'text-decoration': this.el.css('text-decoration'),
      'color': this.el.css('color'),
      'padding-top': this.el.css('padding-top'),
      'padding-bottom': this.el.css('padding-bottom'),
      'padding-left': this.el.css('padding-left'),
      'padding-right': this.el.css('padding-right')
    });
    if (!this.follower.allowPointerEvents) {
      el.css('pointer-events', 'none');
    }
    return el;
  };

  return ScrollFollowerSprite;

})();

copyRect = function(rect) {
  return {
    left: rect.left,
    right: rect.right,
    top: rect.top,
    bottom: rect.bottom
  };
};

getRectWidth = function(rect) {
  return rect.right - rect.left;
};

getRectHeight = function(rect) {
  return rect.bottom - rect.top;
};

testRectContains = function(rect, innerRect) {
  return testRectHContains(rect, innerRect) && testRectVContains(rect, innerRect);
};

testRectHContains = function(rect, innerRect) {
  return innerRect.left >= rect.left && innerRect.right <= rect.right;
};

testRectVContains = function(rect, innerRect) {
  return innerRect.top >= rect.top && innerRect.bottom <= rect.bottom;
};

hContainRect = function(rect, outerRect) {
  if (rect.left < outerRect.left) {
    rect.right = outerRect.left + getRectWidth(rect);
    rect.left = outerRect.left;
    return true;
  } else if (rect.right > outerRect.right) {
    rect.left = outerRect.right - getRectWidth(rect);
    rect.right = outerRect.right;
    return true;
  } else {
    return false;
  }
};

vContainRect = function(rect, outerRect) {
  if (rect.top < outerRect.top) {
    rect.bottom = outerRect.top + getRectHeight(rect);
    rect.top = outerRect.top;
    return true;
  } else if (rect.bottom > outerRect.bottom) {
    rect.top = outerRect.bottom - getRectHeight(rect);
    rect.bottom = outerRect.bottom;
    return true;
  } else {
    return false;
  }
};

joinRects = function(rect1, rect2) {
  return {
    left: Math.min(rect1.left, rect2.left),
    right: Math.max(rect1.right, rect2.right),
    top: Math.min(rect1.top, rect2.top),
    bottom: Math.max(rect1.bottom, rect2.bottom)
  };
};

CalendarExtension = (function(superClass) {
  extend(CalendarExtension, superClass);

  function CalendarExtension() {
    return CalendarExtension.__super__.constructor.apply(this, arguments);
  }

  CalendarExtension.prototype.resourceManager = null;

  CalendarExtension.prototype.initialize = function() {
    return this.resourceManager = new ResourceManager(this);
  };

  CalendarExtension.prototype.instantiateView = function(viewType) {
    var spec, viewClass;
    spec = this.getViewSpec(viewType);
    viewClass = spec['class'];
    if (this.options.resources && spec.options.resources !== false) {
      if (spec.queryResourceClass) {
        viewClass = spec.queryResourceClass(spec) || viewClass;
      } else if (spec.resourceClass) {
        viewClass = spec.resourceClass;
      }
    }
    return new viewClass(this, viewType, spec.options, spec.duration);
  };

  CalendarExtension.prototype.getResources = function() {
    return Array.prototype.slice.call(this.resourceManager.topLevelResources);
  };

  CalendarExtension.prototype.addResource = function(resourceInput, scroll) {
    var promise;
    if (scroll == null) {
      scroll = false;
    }
    promise = this.resourceManager.addResource(resourceInput);
    if (scroll && this.view.scrollToResource) {
      promise.then((function(_this) {
        return function(resource) {
          return _this.view.scrollToResource(resource);
        };
      })(this));
    }
  };

  CalendarExtension.prototype.removeResource = function(idOrResource) {
    return this.resourceManager.removeResource(idOrResource);
  };

  CalendarExtension.prototype.refetchResources = function() {
    this.resourceManager.fetchResources();
  };

  CalendarExtension.prototype.rerenderResources = function() {
    this.resourceManager.resetCurrentResources();
  };

  CalendarExtension.prototype.isSpanAllowed = function(span, constraint) {
    var constrainToResourceIds, ref;
    if (typeof constraint === 'object') {
      constrainToResourceIds = this.getEventResourceIds(constraint);
      if (constrainToResourceIds.length && (!span.resourceId || !(ref = span.resourceId, indexOf.call(constrainToResourceIds, ref) >= 0))) {
        return false;
      }
    }
    return CalendarExtension.__super__.isSpanAllowed.apply(this, arguments);
  };

  CalendarExtension.prototype.mutateSeg = function(span, newProps, largeUnit) {
    var mutatedResourceIds, newResourceId, oldResourceId, ref;
    if (newProps.resourceId) {
      oldResourceId = ((ref = span.resource) != null ? ref.id : void 0) || span.resourceId;
      newResourceId = newProps.resourceId;
      mutatedResourceIds = this.getEventResourceIds(span.event);
      if (oldResourceId !== newResourceId) {
        mutatedResourceIds = mutatedResourceIds.filter(function(resourceId) {
          return resourceId !== oldResourceId && resourceId !== newResourceId;
        });
        mutatedResourceIds.push(newResourceId);
      }
      newProps = $.extend({}, newProps);
      this.setEventResourceIds(newProps, mutatedResourceIds);
    }
    return this.mutateEvent(span.event, newProps, largeUnit);
  };

  CalendarExtension.prototype.getPeerEvents = function(span, event) {
    var filteredPeerEvents, isPeer, j, k, l, len, len1, len2, newResourceId, newResourceIds, peerEvent, peerEvents, peerResourceId, peerResourceIds;
    peerEvents = CalendarExtension.__super__.getPeerEvents.apply(this, arguments);
    newResourceIds = span.resourceId ? [span.resourceId] : event ? this.getEventResourceIds(event) : [];
    filteredPeerEvents = [];
    for (j = 0, len = peerEvents.length; j < len; j++) {
      peerEvent = peerEvents[j];
      isPeer = false;
      peerResourceIds = this.getEventResourceIds(peerEvent);
      if (!peerResourceIds.length || !newResourceIds.length) {
        isPeer = true;
      } else {
        for (k = 0, len1 = peerResourceIds.length; k < len1; k++) {
          peerResourceId = peerResourceIds[k];
          for (l = 0, len2 = newResourceIds.length; l < len2; l++) {
            newResourceId = newResourceIds[l];
            if (newResourceId === peerResourceId) {
              isPeer = true;
              break;
            }
          }
        }
      }
      if (isPeer) {
        filteredPeerEvents.push(peerEvent);
      }
    }
    return filteredPeerEvents;
  };

  CalendarExtension.prototype.spanContainsSpan = function(outerSpan, innerSpan) {
    if (outerSpan.resourceId && outerSpan.resourceId !== innerSpan.resourceId) {
      return false;
    } else {
      return CalendarExtension.__super__.spanContainsSpan.apply(this, arguments);
    }
  };

  CalendarExtension.prototype.getCurrentBusinessHourEvents = function(wholeDay) {
    var allEvents, anyCustomBusinessHours, event, events, flatResources, j, k, l, len, len1, len2, resource;
    flatResources = this.resourceManager.getFlatResources();
    anyCustomBusinessHours = false;
    for (j = 0, len = flatResources.length; j < len; j++) {
      resource = flatResources[j];
      if (resource.businessHours) {
        anyCustomBusinessHours = true;
      }
    }
    if (anyCustomBusinessHours) {
      allEvents = [];
      for (k = 0, len1 = flatResources.length; k < len1; k++) {
        resource = flatResources[k];
        events = this.computeBusinessHourEvents(wholeDay, resource.businessHours || this.options.businessHours);
        for (l = 0, len2 = events.length; l < len2; l++) {
          event = events[l];
          event.resourceId = resource.id;
          allEvents.push(event);
        }
      }
      return allEvents;
    } else {
      return CalendarExtension.__super__.getCurrentBusinessHourEvents.apply(this, arguments);
    }
  };

  CalendarExtension.prototype.buildSelectSpan = function(startInput, endInput, resourceId) {
    var span;
    span = CalendarExtension.__super__.buildSelectSpan.apply(this, arguments);
    if (resourceId) {
      span.resourceId = resourceId;
    }
    return span;
  };

  CalendarExtension.prototype.getResourceById = function(id) {
    return this.resourceManager.getResourceById(id);
  };

  CalendarExtension.prototype.normalizeEvent = function(event) {
    CalendarExtension.__super__.normalizeEvent.apply(this, arguments);
    if (event.resourceId == null) {
      event.resourceId = null;
    }
    return event.resourceIds != null ? event.resourceIds : event.resourceIds = null;
  };

  CalendarExtension.prototype.getEventResourceId = function(event) {
    return this.getEventResourceIds(event)[0];
  };

  CalendarExtension.prototype.getEventResourceIds = function(event) {
    var j, len, normalResourceId, normalResourceIds, ref, ref1, ref2, resourceId;
    resourceId = String((ref = (ref1 = event[this.getEventResourceField()]) != null ? ref1 : event.resourceId) != null ? ref : '');
    if (resourceId) {
      return [resourceId];
    } else if (event.resourceIds) {
      normalResourceIds = [];
      ref2 = event.resourceIds;
      for (j = 0, len = ref2.length; j < len; j++) {
        resourceId = ref2[j];
        normalResourceId = String(resourceId != null ? resourceId : '');
        if (normalResourceId) {
          normalResourceIds.push(normalResourceId);
        }
      }
      return normalResourceIds;
    } else {
      return [];
    }
  };

  CalendarExtension.prototype.setEventResourceId = function(event, resourceId) {
    return this.setEventResourceIds(event, resourceId ? [resourceId] : []);
  };

  CalendarExtension.prototype.setEventResourceIds = function(event, resourceIds) {
    event[this.getEventResourceField()] = resourceIds.length === 1 ? resourceIds[0] : null;
    return event.resourceIds = resourceIds.length > 1 ? resourceIds : null;
  };

  CalendarExtension.prototype.getEventResourceField = function() {
    return this.options['eventResourceField'] || 'resourceId';
  };

  CalendarExtension.prototype.getResourceEvents = function(idOrResource) {
    var resource;
    resource = typeof idOrResource === 'object' ? idOrResource : this.getResourceById(idOrResource);
    if (resource) {
      return this.clientEvents((function(_this) {
        return function(event) {
          return $.inArray(resource.id, _this.getEventResourceIds(event)) !== -1;
        };
      })(this));
    } else {
      return [];
    }
  };

  CalendarExtension.prototype.getEventResource = function(idOrEvent) {
    return this.getEventResources(idOrEvent)[0];
  };

  CalendarExtension.prototype.getEventResources = function(idOrEvent) {
    var event, j, len, ref, resource, resourceId, resources;
    event = typeof idOrEvent === 'object' ? idOrEvent : this.clientEvents(idOrEvent)[0];
    resources = [];
    if (event) {
      ref = this.getEventResourceIds(event);
      for (j = 0, len = ref.length; j < len; j++) {
        resourceId = ref[j];
        resource = this.getResourceById(resourceId);
        if (resource) {
          resources.push(resource);
        }
      }
    }
    return resources;
  };

  return CalendarExtension;

})(Calendar);

Calendar.prototype = CalendarExtension.prototype;

origSetElement = View.prototype.setElement;

origRemoveElement = View.prototype.removeElement;

origHandleDate = View.prototype.handleDate;

origOnDateRender = View.prototype.onDateRender;

origExecuteEventsRender = View.prototype.executeEventsRender;

View.prototype.isResourcesBound = false;

View.prototype.isResourcesSet = false;

Calendar.defaults.refetchResourcesOnNavigate = false;

View.prototype.setElement = function() {
  var promise;
  promise = origSetElement.apply(this, arguments);
  if (!this.opt('refetchResourcesOnNavigate')) {
    this.bindResources();
  }
  return promise;
};

View.prototype.removeElement = function() {
  this.unbindResources({
    skipRerender: true
  });
  return origRemoveElement.apply(this, arguments);
};


/*
Replace the supermethod's logic. Important to unbind/bind *events* (TODO: make more DRY)
 */

View.prototype.handleDate = function(date, isReset) {
  var resourcesNeedDate;
  resourcesNeedDate = this.opt('refetchResourcesOnNavigate');
  this.unbindEvents();
  if (resourcesNeedDate) {
    this.unbindResources({
      skipUnrender: true
    });
  }
  return this.requestDateRender(date).then((function(_this) {
    return function() {
      _this.bindEvents();
      if (resourcesNeedDate) {
        return _this.bindResources(true);
      }
    };
  })(this));
};

View.prototype.onDateRender = function() {
  processLicenseKey(this.calendar.options.schedulerLicenseKey, this.el);
  return origOnDateRender.apply(this, arguments);
};

View.prototype.executeEventsRender = function(events) {
  return this.whenResourcesSet().then((function(_this) {
    return function() {
      return origExecuteEventsRender.call(_this, events);
    };
  })(this));
};

View.prototype.bindResources = function(forceInitialFetch) {
  var promise;
  if (!this.isResourcesBound) {
    this.isResourcesBound = true;
    this.trigger('resourcesBind');
    promise = forceInitialFetch ? this.fetchResources() : this.requestResources();
    return this.rejectOn('resourcesUnbind', promise).then((function(_this) {
      return function(resources) {
        _this.listenTo(_this.calendar.resourceManager, {
          set: _this.setResources,
          reset: _this.setResources,
          unset: _this.unsetResources,
          add: _this.addResource,
          remove: _this.removeResource
        });
        return _this.setResources(resources);
      };
    })(this));
  }
};

View.prototype.unbindResources = function(teardownOptions) {
  if (this.isResourcesBound) {
    this.isResourcesBound = false;
    this.stopListeningTo(this.calendar.resourceManager);
    this.unsetResources(teardownOptions);
    return this.trigger('resourcesUnbind');
  }
};

View.prototype.setResources = function(resources) {
  var isReset;
  isReset = this.isResourcesSet;
  this.isResourcesSet = true;
  this.handleResources(resources, isReset);
  return this.trigger(isReset ? 'resourcesReset' : 'resourcesSet', resources);
};

View.prototype.unsetResources = function(teardownOptions) {
  if (this.isResourcesSet) {
    this.isResourcesSet = false;
    this.handleResourcesUnset(teardownOptions);
    return this.trigger('resourcesUnset');
  }
};

View.prototype.whenResourcesSet = function() {
  if (this.isResourcesSet) {
    return Promise.resolve();
  } else {
    return new Promise((function(_this) {
      return function(resolve) {
        return _this.one('resourcesSet', resolve);
      };
    })(this));
  }
};

View.prototype.addResource = function(resource) {
  if (this.isResourcesSet) {
    this.handleResourceAdd(resource);
    return this.trigger('resourceAdd', resource);
  }
};

View.prototype.removeResource = function(resource) {
  if (this.isResourcesSet) {
    this.handleResourceRemove(resource);
    return this.trigger('resourceRemove', resource);
  }
};

View.prototype.handleResources = function(resources) {
  if (this.isEventsRendered) {
    return this.requestCurrentEventsRender();
  }
};

View.prototype.handleResourcesUnset = function(teardownOptions) {
  if (teardownOptions == null) {
    teardownOptions = {};
  }
  return this.requestEventsUnrender();
};

View.prototype.handleResourceAdd = function(resource) {
  if (this.isEventsRendered) {
    return this.requestCurrentEventsRender();
  }
};

View.prototype.handleResourceRemove = function(resource) {
  if (this.isEventsRendered) {
    return this.requestCurrentEventsRender();
  }
};


/*
Like fetchResources, but won't refetch if already fetched (regardless of start/end).
If refetchResourcesOnNavigate is enabled,
this function expects the view's start/end to be already populated.
 */

View.prototype.requestResources = function() {
  if (this.opt('refetchResourcesOnNavigate')) {
    return this.calendar.resourceManager.getResources(this.start, this.end);
  } else {
    return this.calendar.resourceManager.getResources();
  }
};


/*
If refetchResourcesOnNavigate is enabled,
this function expects the view's start/end to be already populated.
 */

View.prototype.fetchResources = function() {
  if (this.opt('refetchResourcesOnNavigate')) {
    return this.calendar.resourceManager.fetchResources(this.start, this.end);
  } else {
    return this.calendar.resourceManager.fetchResources();
  }
};

View.prototype.getCurrentResources = function() {
  return this.calendar.resourceManager.topLevelResources;
};

origGetSegCustomClasses = Grid.prototype.getSegCustomClasses;

origGetSegDefaultBackgroundColor = Grid.prototype.getSegDefaultBackgroundColor;

origGetSegDefaultBorderColor = Grid.prototype.getSegDefaultBorderColor;

origGetSegDefaultTextColor = Grid.prototype.getSegDefaultTextColor;

Grid.prototype.getSegCustomClasses = function(seg) {
  var classes, j, len, ref, resource;
  classes = origGetSegCustomClasses.apply(this, arguments);
  ref = this.getSegResources(seg);
  for (j = 0, len = ref.length; j < len; j++) {
    resource = ref[j];
    classes = classes.concat(resource.eventClassName || []);
  }
  return classes;
};

Grid.prototype.getSegDefaultBackgroundColor = function(seg) {
  var currentResource, j, len, resources, val;
  resources = this.getSegResources(seg);
  for (j = 0, len = resources.length; j < len; j++) {
    currentResource = resources[j];
    while (currentResource) {
      val = currentResource.eventBackgroundColor || currentResource.eventColor;
      if (val) {
        return val;
      }
      currentResource = currentResource._parent;
    }
  }
  return origGetSegDefaultBackgroundColor.apply(this, arguments);
};

Grid.prototype.getSegDefaultBorderColor = function(seg) {
  var currentResource, j, len, resources, val;
  resources = this.getSegResources(seg);
  for (j = 0, len = resources.length; j < len; j++) {
    currentResource = resources[j];
    while (currentResource) {
      val = currentResource.eventBorderColor || currentResource.eventColor;
      if (val) {
        return val;
      }
      currentResource = currentResource._parent;
    }
  }
  return origGetSegDefaultBorderColor.apply(this, arguments);
};

Grid.prototype.getSegDefaultTextColor = function(seg) {
  var currentResource, j, len, resources, val;
  resources = this.getSegResources(seg);
  for (j = 0, len = resources.length; j < len; j++) {
    currentResource = resources[j];
    while (currentResource) {
      val = currentResource.eventTextColor;
      if (val) {
        return val;
      }
      currentResource = currentResource._parent;
    }
  }
  return origGetSegDefaultTextColor.apply(this, arguments);
};

Grid.prototype.getSegResources = function(seg) {
  if (seg.resource) {
    return [seg.resource];
  } else {
    return this.view.calendar.getEventResources(seg.event);
  }
};

ResourceManager = (function(superClass) {
  extend(ResourceManager, superClass);

  ResourceManager.mixin(EmitterMixin);

  ResourceManager.resourceGuid = 1;

  ResourceManager.ajaxDefaults = {
    dataType: 'json',
    cache: false
  };

  ResourceManager.prototype.calendar = null;

  ResourceManager.prototype.fetchId = 0;

  ResourceManager.prototype.topLevelResources = null;

  ResourceManager.prototype.resourcesById = null;

  ResourceManager.prototype.fetching = null;

  function ResourceManager(calendar1) {
    this.calendar = calendar1;
    this.initializeCache();
  }


  /*
  	Like fetchResources, but won't refetch if already fetched (regardless of start/end).
   */

  ResourceManager.prototype.getResources = function(start, end) {
    return this.fetching || this.fetchResources(start, end);
  };


  /*
  	Will always fetch, even if done previously.
  	Accepts optional chrono-related params to pass on to the raw resource sources.
  	Returns a promise.
   */

  ResourceManager.prototype.fetchResources = function(start, end) {
    var currentFetchId;
    currentFetchId = (this.fetchId += 1);
    return this.fetching = new Promise((function(_this) {
      return function(resolve, reject) {
        return _this.fetchResourceInputs(function(resourceInputs) {
          if (currentFetchId === _this.fetchId) {
            _this.setResources(resourceInputs);
            return resolve(_this.topLevelResources);
          } else {
            return reject();
          }
        }, start, end);
      };
    })(this));
  };


  /*
  	Accepts optional chrono-related params to pass on to the raw resource sources.
  	Calls callback when done.
   */

  ResourceManager.prototype.fetchResourceInputs = function(callback, start, end) {
    var calendar, options, requestParams, source;
    calendar = this.calendar;
    options = calendar.options;
    source = options.resources;
    if ($.type(source) === 'string') {
      source = {
        url: source
      };
    }
    switch ($.type(source)) {
      case 'function':
        this.calendar.pushLoading();
        return source((function(_this) {
          return function(resourceInputs) {
            _this.calendar.popLoading();
            return callback(resourceInputs);
          };
        })(this), start, end, options.timezone);
      case 'object':
        calendar.pushLoading();
        requestParams = {};
        if (start && end) {
          requestParams[options.startParam] = start.format();
          requestParams[options.endParam] = end.format();
          if (options.timezone && options.timezone !== 'local') {
            requestParams[options.timezoneParam] = options.timezone;
          }
        }
        return $.ajax($.extend({
          data: requestParams
        }, ResourceManager.ajaxDefaults, source)).then((function(_this) {
          return function(resourceInputs) {
            calendar.popLoading();
            return callback(resourceInputs);
          };
        })(this));
      case 'array':
        return callback(source);
      default:
        return callback([]);
    }
  };

  ResourceManager.prototype.getResourceById = function(id) {
    return this.resourcesById[id];
  };

  ResourceManager.prototype.getFlatResources = function() {
    var id, results;
    results = [];
    for (id in this.resourcesById) {
      results.push(this.resourcesById[id]);
    }
    return results;
  };

  ResourceManager.prototype.initializeCache = function() {
    this.topLevelResources = [];
    return this.resourcesById = {};
  };

  ResourceManager.prototype.setResources = function(resourceInputs) {
    var j, len, resource, resourceInput, resources, validResources, wasSet;
    wasSet = Boolean(this.topLevelResources);
    this.initializeCache();
    resources = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = resourceInputs.length; j < len; j++) {
        resourceInput = resourceInputs[j];
        results.push(this.buildResource(resourceInput));
      }
      return results;
    }).call(this);
    validResources = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = resources.length; j < len; j++) {
        resource = resources[j];
        if (this.addResourceToIndex(resource)) {
          results.push(resource);
        }
      }
      return results;
    }).call(this);
    for (j = 0, len = validResources.length; j < len; j++) {
      resource = validResources[j];
      this.addResourceToTree(resource);
    }
    if (wasSet) {
      this.trigger('reset', this.topLevelResources);
    } else {
      this.trigger('set', this.topLevelResources);
    }
    return this.calendar.publiclyTrigger('resourcesSet', null, this.topLevelResources);
  };

  ResourceManager.prototype.resetCurrentResources = function() {
    if (this.topLevelResources) {
      return this.trigger('reset', this.topLevelResources);
    }
  };

  ResourceManager.prototype.addResource = function(resourceInput) {
    return this.getResources().then((function(_this) {
      return function() {
        var resource;
        resource = _this.buildResource(resourceInput);
        if (_this.addResourceToIndex(resource)) {
          _this.addResourceToTree(resource);
          _this.trigger('add', resource);
          return resource;
        } else {
          return false;
        }
      };
    })(this));
  };

  ResourceManager.prototype.addResourceToIndex = function(resource) {
    var child, j, len, ref;
    if (this.resourcesById[resource.id]) {
      return false;
    } else {
      this.resourcesById[resource.id] = resource;
      ref = resource.children;
      for (j = 0, len = ref.length; j < len; j++) {
        child = ref[j];
        this.addResourceToIndex(child);
      }
      return true;
    }
  };

  ResourceManager.prototype.addResourceToTree = function(resource) {
    var parent, parentId, ref, siblings;
    if (!resource.parent) {
      parentId = String((ref = resource['parentId']) != null ? ref : '');
      if (parentId) {
        parent = this.resourcesById[parentId];
        if (parent) {
          resource.parent = parent;
          siblings = parent.children;
        } else {
          return false;
        }
      } else {
        siblings = this.topLevelResources;
      }
      siblings.push(resource);
    }
    return true;
  };

  ResourceManager.prototype.removeResource = function(idOrResource) {
    var id;
    id = typeof idOrResource === 'object' ? idOrResource.id : idOrResource;
    return this.getResources().then((function(_this) {
      return function() {
        var resource;
        resource = _this.removeResourceFromIndex(id);
        if (resource) {
          _this.removeResourceFromTree(resource);
          _this.trigger('remove', resource);
        }
        return resource;
      };
    })(this));
  };

  ResourceManager.prototype.removeResourceFromIndex = function(resourceId) {
    var child, j, len, ref, resource;
    resource = this.resourcesById[resourceId];
    if (resource) {
      delete this.resourcesById[resourceId];
      ref = resource.children;
      for (j = 0, len = ref.length; j < len; j++) {
        child = ref[j];
        this.removeResourceFromIndex(child.id);
      }
      return resource;
    } else {
      return false;
    }
  };

  ResourceManager.prototype.removeResourceFromTree = function(resource, siblings) {
    var i, j, len, sibling;
    if (siblings == null) {
      siblings = this.topLevelResources;
    }
    for (i = j = 0, len = siblings.length; j < len; i = ++j) {
      sibling = siblings[i];
      if (sibling === resource) {
        resource.parent = null;
        siblings.splice(i, 1);
        return true;
      }
      if (this.removeResourceFromTree(resource, sibling.children)) {
        return true;
      }
    }
    return false;
  };

  ResourceManager.prototype.buildResource = function(resourceInput) {
    var child, childInput, rawClassName, ref, resource;
    resource = $.extend({}, resourceInput);
    resource.id = String((ref = resourceInput.id) != null ? ref : '_fc' + ResourceManager.resourceGuid++);
    rawClassName = resourceInput.eventClassName;
    resource.eventClassName = (function() {
      switch ($.type(rawClassName)) {
        case 'string':
          return rawClassName.split(/\s+/);
        case 'array':
          return rawClassName;
        default:
          return [];
      }
    })();
    resource.children = (function() {
      var j, len, ref1, ref2, results;
      ref2 = (ref1 = resourceInput.children) != null ? ref1 : [];
      results = [];
      for (j = 0, len = ref2.length; j < len; j++) {
        childInput = ref2[j];
        child = this.buildResource(childInput);
        child.parent = resource;
        results.push(child);
      }
      return results;
    }).call(this);
    return resource;
  };

  return ResourceManager;

})(Class);

Calendar.defaults.filterResourcesWithEvents = false;


/*
A view that structurally distinguishes events by resource
 */

ResourceViewMixin = {
  isResourcesRendered: false,
  isResourcesDirty: false,
  resourceRenderQueue: null,
  resourceTextFunc: null,
  canRenderSpecificResources: false,
  setElement: function() {
    this.resourceRenderQueue = new TaskQueue();
    return View.prototype.setElement.apply(this, arguments);
  },
  onDateRender: function() {
    return this.rejectOn('dateUnrender', this.whenResourcesRendered()).then((function(_this) {
      return function() {
        return View.prototype.onDateRender.apply(_this, arguments);
      };
    })(this));
  },
  handleEvents: function(events) {
    var filteredResources, resources;
    if (this.opt('filterResourcesWithEvents')) {
      if (this.isResourcesSet) {
        resources = this.getCurrentResources();
        filteredResources = this.filterResourcesWithEvents(resources, events);
        return this.requestResourcesRender(filteredResources);
      }
    } else {
      if (this.isResourcesRendered && !this.isResourcesDirty) {
        return this.requestEventsRender(events);
      }
    }
  },
  handleResources: function(resources) {
    var events, filteredResources;
    if (this.opt('filterResourcesWithEvents')) {
      if (this.isEventsSet) {
        events = this.getCurrentEvents();
        filteredResources = this.filterResourcesWithEvents(resources, events);
        return this.requestResourcesRender(filteredResources);
      }
    } else {
      return this.requestResourcesRender(resources);
    }
  },
  handleResourcesUnset: function(teardownOptions) {
    if (teardownOptions == null) {
      teardownOptions = {};
    }
    if (teardownOptions.skipUnrender) {
      return this.isResourcesDirty = this.isResourcesRendered;
    } else {
      return this.requestResourcesUnrender(teardownOptions);
    }
  },
  handleResourceAdd: function(resource) {
    var a, events;
    if (this.canRenderSpecificResources) {
      if (this.opt('filterResourcesWithEvents')) {
        if (this.isEventsSet) {
          events = this.getCurrentEvents();
          a = this.filterResourcesWithEvents([resource], events);
          if (a.length) {
            return this.requestResourceRender(a[0]);
          }
        }
      } else {
        return this.requestResourceRender(resource);
      }
    } else {
      return this.handleResources(this.getCurrentResources());
    }
  },
  handleResourceRemove: function(resource) {
    if (this.canRenderSpecificResources) {
      return this.requestResourceUnrender(resource);
    } else {
      return this.handleResources(this.getCurrentResources());
    }
  },
  requestResourcesRender: function(resources) {
    return this.resourceRenderQueue.add((function(_this) {
      return function() {
        return _this.executeResourcesRender(resources);
      };
    })(this));
  },
  requestResourcesUnrender: function(teardownOptions) {
    if (this.isResourcesRendered) {
      return this.resourceRenderQueue.add((function(_this) {
        return function() {
          return _this.executeResourcesUnrender(teardownOptions);
        };
      })(this));
    } else {
      return Promise.resolve();
    }
  },
  requestResourceRender: function(resource) {
    return this.resourceRenderQueue.add((function(_this) {
      return function() {
        return _this.executeResourceRender(resource);
      };
    })(this));
  },
  requestResourceUnrender: function(resource) {
    return this.resourceRenderQueue.add((function(_this) {
      return function() {
        return _this.executeResourceUnrender(resource);
      };
    })(this));
  },
  executeResourcesRender: function(resources) {
    this.captureScroll();
    this.freezeHeight();
    return this.executeResourcesUnrender().then((function(_this) {
      return function() {
        _this.renderResources(resources);
        _this.thawHeight();
        _this.releaseScroll();
        return _this.reportResourcesRender();
      };
    })(this));
  },
  executeResourcesUnrender: function(teardownOptions) {
    if (this.isResourcesRendered) {
      return this.requestEventsUnrender().then((function(_this) {
        return function() {
          _this.captureScroll();
          _this.freezeHeight();
          _this.unrenderResources(teardownOptions);
          _this.thawHeight();
          _this.releaseScroll();
          return _this.reportResourcesUnrender();
        };
      })(this));
    } else {
      return Promise.resolve();
    }
  },
  executeResourceRender: function(resource) {
    if (this.isResourcesRendered) {
      this.captureScroll();
      this.freezeHeight();
      this.renderResource(resource);
      this.thawHeight();
      return this.releaseScroll();
    } else {
      return Promise.reject();
    }
  },
  executeResourceUnrender: function(resource) {
    if (this.isResourcesRendered) {
      this.captureScroll();
      this.freezeHeight();
      this.unrenderResource(resource);
      this.thawHeight();
      return this.releaseScroll();
    } else {
      return Promise.reject();
    }
  },
  reportResourcesRender: function() {
    this.isResourcesRendered = true;
    this.trigger('resourcesRender');
    if (this.isEventsSet) {
      this.requestEventsRender(this.getCurrentEvents());
    }
  },
  reportResourcesUnrender: function() {
    this.isResourcesRendered = false;
    return this.isResourcesDirty = false;
  },
  whenResourcesRendered: function() {
    if (this.isResourcesRendered && !this.isResourcesDirty) {
      return Promise.resolve();
    } else {
      return new Promise((function(_this) {
        return function(resolve) {
          return _this.one('resourcesRender', resolve);
        };
      })(this));
    }
  },
  renderResources: function(resources) {},
  unrenderResources: function(teardownOptions) {},
  renderResource: function(resource) {},
  unrenderResource: function(resource) {},
  isEventDraggable: function(event) {
    return this.isEventResourceEditable(event) || View.prototype.isEventDraggable.call(this, event);
  },
  isEventResourceEditable: function(event) {
    var ref, ref1, ref2;
    return (ref = (ref1 = (ref2 = event.resourceEditable) != null ? ref2 : (event.source || {}).resourceEditable) != null ? ref1 : this.opt('eventResourceEditable')) != null ? ref : this.isEventGenerallyEditable(event);
  },
  getResourceText: function(resource) {
    return this.getResourceTextFunc()(resource);
  },
  getResourceTextFunc: function() {
    var func;
    if (this.resourceTextFunc) {
      return this.resourceTextFunc;
    } else {
      func = this.opt('resourceText');
      if (typeof func !== 'function') {
        func = function(resource) {
          return resource.title || resource.id;
        };
      }
      return this.resourceTextFunc = func;
    }
  },
  triggerDayClick: function(span, dayEl, ev) {
    var resourceManager;
    resourceManager = this.calendar.resourceManager;
    return this.publiclyTrigger('dayClick', dayEl, this.calendar.applyTimezone(span.start), ev, this, resourceManager.getResourceById(span.resourceId));
  },
  triggerSelect: function(span, ev) {
    var resourceManager;
    resourceManager = this.calendar.resourceManager;
    return this.publiclyTrigger('select', null, this.calendar.applyTimezone(span.start), this.calendar.applyTimezone(span.end), ev, this, resourceManager.getResourceById(span.resourceId));
  },
  triggerExternalDrop: function(event, dropLocation, el, ev, ui) {
    this.publiclyTrigger('drop', el[0], dropLocation.start, ev, ui, dropLocation.resourceId);
    if (event) {
      return this.publiclyTrigger('eventReceive', null, event);
    }
  },

  /* Hacks
  	 * ------------------------------------------------------------------------------------------------------------------
  	These triggers usually call mutateEvent with dropLocation, which causes an event modification and rerender.
  	But mutateEvent isn't aware of eventResourceField, so it might be setting the wrong property. Workaround.
  	TODO: normalize somewhere else. maybe make a hook in core.
   */
  reportExternalDrop: function() {
    var dropLocation, meta, otherArgs, ref;
    meta = arguments[0], dropLocation = arguments[1], otherArgs = 3 <= arguments.length ? slice.call(arguments, 2) : [];
    dropLocation = this.normalizeDropLocation(dropLocation);
    return (ref = View.prototype.reportExternalDrop).call.apply(ref, [this, meta, dropLocation].concat(slice.call(otherArgs)));
  },
  normalizeDropLocation: function(dropLocation) {
    var out;
    out = $.extend({}, dropLocation);
    delete out.resourceId;
    this.calendar.setEventResourceId(out, dropLocation.resourceId);
    return out;
  },
  filterResourcesWithEvents: function(resources, events) {
    var event, j, k, len, len1, ref, resourceId, resourceIdHits;
    resourceIdHits = {};
    for (j = 0, len = events.length; j < len; j++) {
      event = events[j];
      ref = this.calendar.getEventResourceIds(event);
      for (k = 0, len1 = ref.length; k < len1; k++) {
        resourceId = ref[k];
        resourceIdHits[resourceId] = true;
      }
    }
    return _filterResourcesWithEvents(resources, resourceIdHits);
  }
};

_filterResourcesWithEvents = function(sourceResources, resourceIdHits) {
  var filteredChildren, filteredResource, filteredResources, j, len, sourceResource;
  filteredResources = [];
  for (j = 0, len = sourceResources.length; j < len; j++) {
    sourceResource = sourceResources[j];
    if (sourceResource.children.length) {
      filteredChildren = _filterResourcesWithEvents(sourceResource.children, resourceIdHits);
      if (filteredChildren.length || resourceIdHits[sourceResource.id]) {
        filteredResource = createObject(sourceResource);
        filteredResource.children = filteredChildren;
        filteredResources.push(filteredResource);
      }
    } else {
      if (resourceIdHits[sourceResource.id]) {
        filteredResources.push(sourceResource);
      }
    }
  }
  return filteredResources;
};


/*
For vertical resource view.
For views that rely on grids that don't render their resources and dates together.
 */

VertResourceViewMixin = $.extend({}, ResourceViewMixin, {
  executeResourcesRender: function(resources) {
    this.setResourcesOnGrids(resources);
    if (this.isDateRendered) {
      return this.requestDateRender().then((function(_this) {
        return function() {
          return _this.reportResourcesRender();
        };
      })(this));
    } else {
      return Promise.resolve();
    }
  },
  executeResourcesUnrender: function(teardownOptions) {
    if (teardownOptions == null) {
      teardownOptions = {};
    }
    this.unsetResourcesOnGrids();
    if (this.isDateRendered && !teardownOptions.skipRerender) {
      return this.requestDateRender().then((function(_this) {
        return function() {
          return _this.reportResourcesUnrender();
        };
      })(this));
    } else {
      this.reportResourcesUnrender();
      return Promise.resolve();
    }
  },
  executeDateRender: function(date) {
    return View.prototype.executeDateRender.apply(this, arguments).then((function(_this) {
      return function() {
        if (_this.isResourcesSet) {
          return _this.reportResourcesRender();
        }
      };
    })(this));
  },
  executeDateUnrender: function(date) {
    return View.prototype.executeDateUnrender.apply(this, arguments).then((function(_this) {
      return function() {
        if (_this.isResourcesSet) {
          return _this.reportResourcesUnrender();
        }
      };
    })(this));
  },
  setResourcesOnGrids: function(resources) {},
  unsetResourcesOnGrids: function() {}
});

ResourceGridMixin = {
  allowCrossResource: true,
  eventRangeToSpans: function(range, event) {
    var j, len, resourceId, resourceIds, results;
    resourceIds = this.view.calendar.getEventResourceIds(event);
    if (resourceIds.length) {
      results = [];
      for (j = 0, len = resourceIds.length; j < len; j++) {
        resourceId = resourceIds[j];
        results.push($.extend({}, range, {
          resourceId: resourceId
        }));
      }
      return results;
    } else if (FC.isBgEvent(event)) {
      return Grid.prototype.eventRangeToSpans.apply(this, arguments);
    } else {
      return [];
    }
  },
  fabricateHelperEvent: function(eventLocation, seg) {
    var event;
    event = Grid.prototype.fabricateHelperEvent.apply(this, arguments);
    this.view.calendar.setEventResourceId(event, eventLocation.resourceId);
    return event;
  },
  computeEventDrop: function(startSpan, endSpan, event) {
    var dropLocation;
    if (this.view.isEventStartEditable(event)) {
      dropLocation = Grid.prototype.computeEventDrop.apply(this, arguments);
    } else {
      dropLocation = FC.pluckEventDateProps(event);
    }
    if (dropLocation) {
      if (this.view.isEventResourceEditable(event)) {
        dropLocation.resourceId = endSpan.resourceId;
      } else {
        dropLocation.resourceId = startSpan.resourceId;
      }
    }
    return dropLocation;
  },
  computeExternalDrop: function(span, meta) {
    var dropLocation;
    dropLocation = Grid.prototype.computeExternalDrop.apply(this, arguments);
    if (dropLocation) {
      dropLocation.resourceId = span.resourceId;
    }
    return dropLocation;
  },
  computeEventResize: function(type, startSpan, endSpan, event) {
    var resizeLocation;
    if (!this.allowCrossResource && startSpan.resourceId !== endSpan.resourceId) {
      return;
    }
    resizeLocation = Grid.prototype.computeEventResize.apply(this, arguments);
    if (resizeLocation) {
      resizeLocation.resourceId = startSpan.resourceId;
    }
    return resizeLocation;
  },
  computeSelectionSpan: function(startSpan, endSpan) {
    var selectionSpan;
    if (!this.allowCrossResource && startSpan.resourceId !== endSpan.resourceId) {
      return;
    }
    selectionSpan = Grid.prototype.computeSelectionSpan.apply(this, arguments);
    if (selectionSpan) {
      selectionSpan.resourceId = startSpan.resourceId;
    }
    return selectionSpan;
  }
};


/*
Requirements:
- must be a Grid
- grid must have a view that's a ResourceView
- DayTableMixin must already be mixed in
 */

ResourceDayTableMixin = {
  flattenedResources: null,
  resourceCnt: 0,
  datesAboveResources: false,
  allowCrossResource: false,
  setResources: function(resources) {
    this.flattenedResources = this.flattenResources(resources);
    this.resourceCnt = this.flattenedResources.length;
    return this.updateDayTableCols();
  },
  unsetResources: function() {
    this.flattenedResources = null;
    this.resourceCnt = 0;
    return this.updateDayTableCols();
  },
  flattenResources: function(resources) {
    var orderSpecs, orderVal, res, sortFunc;
    orderVal = this.view.opt('resourceOrder');
    if (orderVal) {
      orderSpecs = parseFieldSpecs(orderVal);
      sortFunc = function(a, b) {
        return compareByFieldSpecs(a, b, orderSpecs);
      };
    } else {
      sortFunc = null;
    }
    res = [];
    this.accumulateResources(resources, sortFunc, res);
    return res;
  },
  accumulateResources: function(resources, sortFunc, res) {
    var j, len, resource, results, sortedResources;
    if (sortFunc) {
      sortedResources = resources.slice(0);
      sortedResources.sort(sortFunc);
    } else {
      sortedResources = resources;
    }
    results = [];
    for (j = 0, len = sortedResources.length; j < len; j++) {
      resource = sortedResources[j];
      res.push(resource);
      results.push(this.accumulateResources(resource.children, sortFunc, res));
    }
    return results;
  },
  updateDayTableCols: function() {
    this.datesAboveResources = this.view.opt('groupByDateAndResource');
    return FC.DayTableMixin.updateDayTableCols.call(this);
  },
  computeColCnt: function() {
    return (this.resourceCnt || 1) * this.daysPerRow;
  },
  getColDayIndex: function(col) {
    if (this.isRTL) {
      col = this.colCnt - 1 - col;
    }
    if (this.datesAboveResources) {
      return Math.floor(col / (this.resourceCnt || 1));
    } else {
      return col % this.daysPerRow;
    }
  },
  getColResource: function(col) {
    return this.flattenedResources[this.getColResourceIndex(col)];
  },
  getColResourceIndex: function(col) {
    if (this.isRTL) {
      col = this.colCnt - 1 - col;
    }
    if (this.datesAboveResources) {
      return col % (this.resourceCnt || 1);
    } else {
      return Math.floor(col / this.daysPerRow);
    }
  },
  indicesToCol: function(resourceIndex, dayIndex) {
    var col;
    col = this.datesAboveResources ? dayIndex * (this.resourceCnt || 1) + resourceIndex : resourceIndex * this.daysPerRow + dayIndex;
    if (this.isRTL) {
      col = this.colCnt - 1 - col;
    }
    return col;
  },
  renderHeadTrHtml: function() {
    if (!this.resourceCnt) {
      return FC.DayTableMixin.renderHeadTrHtml.call(this);
    } else {
      if (this.daysPerRow > 1) {
        if (this.datesAboveResources) {
          return this.renderHeadDateAndResourceHtml();
        } else {
          return this.renderHeadResourceAndDateHtml();
        }
      } else {
        return this.renderHeadResourceHtml();
      }
    }
  },
  renderHeadResourceHtml: function() {
    var j, len, ref, resource, resourceHtmls;
    resourceHtmls = [];
    ref = this.flattenedResources;
    for (j = 0, len = ref.length; j < len; j++) {
      resource = ref[j];
      resourceHtmls.push(this.renderHeadResourceCellHtml(resource));
    }
    return this.wrapTr(resourceHtmls, 'renderHeadIntroHtml');
  },
  renderHeadResourceAndDateHtml: function() {
    var date, dateHtmls, dayIndex, j, k, len, ref, ref1, resource, resourceHtmls;
    resourceHtmls = [];
    dateHtmls = [];
    ref = this.flattenedResources;
    for (j = 0, len = ref.length; j < len; j++) {
      resource = ref[j];
      resourceHtmls.push(this.renderHeadResourceCellHtml(resource, null, this.daysPerRow));
      for (dayIndex = k = 0, ref1 = this.daysPerRow; k < ref1; dayIndex = k += 1) {
        date = this.dayDates[dayIndex].clone();
        dateHtmls.push(this.renderHeadResourceDateCellHtml(date, resource));
      }
    }
    return this.wrapTr(resourceHtmls, 'renderHeadIntroHtml') + this.wrapTr(dateHtmls, 'renderHeadIntroHtml');
  },
  renderHeadDateAndResourceHtml: function() {
    var date, dateHtmls, dayIndex, j, k, len, ref, ref1, resource, resourceHtmls;
    dateHtmls = [];
    resourceHtmls = [];
    for (dayIndex = j = 0, ref = this.daysPerRow; j < ref; dayIndex = j += 1) {
      date = this.dayDates[dayIndex].clone();
      dateHtmls.push(this.renderHeadDateCellHtml(date, this.resourceCnt));
      ref1 = this.flattenedResources;
      for (k = 0, len = ref1.length; k < len; k++) {
        resource = ref1[k];
        resourceHtmls.push(this.renderHeadResourceCellHtml(resource, date));
      }
    }
    return this.wrapTr(dateHtmls, 'renderHeadIntroHtml') + this.wrapTr(resourceHtmls, 'renderHeadIntroHtml');
  },
  renderHeadResourceCellHtml: function(resource, date, colspan) {
    return '<th class="fc-resource-cell"' + ' data-resource-id="' + resource.id + '"' + (date ? ' data-date="' + date.format('YYYY-MM-DD') + '"' : '') + (colspan > 1 ? ' colspan="' + colspan + '"' : '') + '>' + htmlEscape(this.view.getResourceText(resource)) + '</th>';
  },
  renderHeadResourceDateCellHtml: function(date, resource, colspan) {
    return this.renderHeadDateCellHtml(date, colspan, 'data-resource-id="' + resource.id + '"');
  },
  processHeadResourceEls: function(containerEl) {
    return containerEl.find('.fc-resource-cell').each((function(_this) {
      return function(col, node) {
        var resource;
        if (_this.datesAboveResources) {
          resource = _this.getColResource(col);
        } else {
          resource = _this.flattenedResources[_this.isRTL ? _this.flattenedResources.length - 1 - col : col];
        }
        return _this.view.publiclyTrigger('resourceRender', resource, resource, $(node), $());
      };
    })(this));
  },
  renderBgCellsHtml: function(row) {
    var col, date, htmls, j, ref, resource;
    if (!this.resourceCnt) {
      return FC.DayTableMixin.renderBgCellsHtml.call(this, row);
    } else {
      htmls = [];
      for (col = j = 0, ref = this.colCnt; j < ref; col = j += 1) {
        date = this.getCellDate(row, col);
        resource = this.getColResource(col);
        htmls.push(this.renderResourceBgCellHtml(date, resource));
      }
      return htmls.join('');
    }
  },
  renderResourceBgCellHtml: function(date, resource) {
    return this.renderBgCellHtml(date, 'data-resource-id="' + resource.id + '"');
  },
  wrapTr: function(cellHtmls, introMethodName) {
    if (this.isRTL) {
      cellHtmls.reverse();
      return '<tr>' + cellHtmls.join('') + this[introMethodName]() + '</tr>';
    } else {
      return '<tr>' + this[introMethodName]() + cellHtmls.join('') + '</tr>';
    }
  },

  /*
  	If there are no per-resource business hour definitions, returns null.
  	Otherwise, returns a list of business hours segs for *every* resource.
   */
  computePerResourceBusinessHourSegs: function(wholeDay) {
    var allSegs, anyCustomBusinessHours, businessHours, event, events, j, k, l, len, len1, len2, ref, ref1, resource, segs;
    if (this.flattenedResources) {
      anyCustomBusinessHours = false;
      ref = this.flattenedResources;
      for (j = 0, len = ref.length; j < len; j++) {
        resource = ref[j];
        if (resource.businessHours) {
          anyCustomBusinessHours = true;
        }
      }
      if (anyCustomBusinessHours) {
        allSegs = [];
        ref1 = this.flattenedResources;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          resource = ref1[k];
          businessHours = resource.businessHours || this.view.calendar.options.businessHours;
          events = this.buildBusinessHourEvents(wholeDay, businessHours);
          for (l = 0, len2 = events.length; l < len2; l++) {
            event = events[l];
            event.resourceId = resource.id;
          }
          segs = this.eventsToSegs(events);
          allSegs.push.apply(allSegs, segs);
        }
        return allSegs;
      }
    }
    return null;
  }
};

ResourceDayGrid = (function(superClass) {
  extend(ResourceDayGrid, superClass);

  function ResourceDayGrid() {
    return ResourceDayGrid.__super__.constructor.apply(this, arguments);
  }

  ResourceDayGrid.mixin(ResourceGridMixin);

  ResourceDayGrid.mixin(ResourceDayTableMixin);

  ResourceDayGrid.prototype.getHitSpan = function(hit) {
    var span;
    span = ResourceDayGrid.__super__.getHitSpan.apply(this, arguments);
    if (this.resourceCnt) {
      span.resourceId = this.getColResource(hit.col).id;
    }
    return span;
  };

  ResourceDayGrid.prototype.spanToSegs = function(span) {
    var copy, genericSegs, j, k, l, len, len1, ref, resourceCnt, resourceIndex, resourceObj, resourceSegs, seg;
    resourceCnt = this.resourceCnt;
    genericSegs = this.datesAboveResources ? this.sliceRangeByDay(span) : this.sliceRangeByRow(span);
    if (!resourceCnt) {
      for (j = 0, len = genericSegs.length; j < len; j++) {
        seg = genericSegs[j];
        if (this.isRTL) {
          seg.leftCol = seg.lastRowDayIndex;
          seg.rightCol = seg.firstRowDayIndex;
        } else {
          seg.leftCol = seg.firstRowDayIndex;
          seg.rightCol = seg.lastRowDayIndex;
        }
      }
      return genericSegs;
    } else {
      resourceSegs = [];
      for (k = 0, len1 = genericSegs.length; k < len1; k++) {
        seg = genericSegs[k];
        for (resourceIndex = l = 0, ref = resourceCnt; l < ref; resourceIndex = l += 1) {
          resourceObj = this.flattenedResources[resourceIndex];
          if (!span.resourceId || span.resourceId === resourceObj.id) {
            copy = $.extend({}, seg);
            copy.resource = resourceObj;
            if (this.isRTL) {
              copy.leftCol = this.indicesToCol(resourceIndex, seg.lastRowDayIndex);
              copy.rightCol = this.indicesToCol(resourceIndex, seg.firstRowDayIndex);
            } else {
              copy.leftCol = this.indicesToCol(resourceIndex, seg.firstRowDayIndex);
              copy.rightCol = this.indicesToCol(resourceIndex, seg.lastRowDayIndex);
            }
            resourceSegs.push(copy);
          }
        }
      }
      return resourceSegs;
    }
  };

  ResourceDayGrid.prototype.renderBusinessHours = function() {
    var segs;
    segs = this.computePerResourceBusinessHourSegs(true);
    if (segs) {
      return this.renderFill('businessHours', segs, 'bgevent');
    } else {
      return ResourceDayGrid.__super__.renderBusinessHours.apply(this, arguments);
    }
  };

  return ResourceDayGrid;

})(FC.DayGrid);

ResourceTimeGrid = (function(superClass) {
  extend(ResourceTimeGrid, superClass);

  function ResourceTimeGrid() {
    return ResourceTimeGrid.__super__.constructor.apply(this, arguments);
  }

  ResourceTimeGrid.mixin(ResourceGridMixin);

  ResourceTimeGrid.mixin(ResourceDayTableMixin);

  ResourceTimeGrid.prototype.getHitSpan = function(hit) {
    var span;
    span = ResourceTimeGrid.__super__.getHitSpan.apply(this, arguments);
    if (this.resourceCnt) {
      span.resourceId = this.getColResource(hit.col).id;
    }
    return span;
  };

  ResourceTimeGrid.prototype.spanToSegs = function(span) {
    var copy, genericSegs, j, k, l, len, len1, ref, resourceCnt, resourceIndex, resourceObj, resourceSegs, seg;
    resourceCnt = this.resourceCnt;
    genericSegs = this.sliceRangeByTimes(span);
    if (!resourceCnt) {
      for (j = 0, len = genericSegs.length; j < len; j++) {
        seg = genericSegs[j];
        seg.col = seg.dayIndex;
      }
      return genericSegs;
    } else {
      resourceSegs = [];
      for (k = 0, len1 = genericSegs.length; k < len1; k++) {
        seg = genericSegs[k];
        for (resourceIndex = l = 0, ref = resourceCnt; l < ref; resourceIndex = l += 1) {
          resourceObj = this.flattenedResources[resourceIndex];
          if (!span.resourceId || span.resourceId === resourceObj.id) {
            copy = $.extend({}, seg);
            copy.resource = resourceObj;
            copy.col = this.indicesToCol(resourceIndex, seg.dayIndex);
            resourceSegs.push(copy);
          }
        }
      }
      return resourceSegs;
    }
  };

  ResourceTimeGrid.prototype.renderBusinessHours = function() {
    var segs;
    segs = this.computePerResourceBusinessHourSegs(false);
    if (segs) {
      return this.renderBusinessSegs(segs);
    } else {
      return ResourceTimeGrid.__super__.renderBusinessHours.apply(this, arguments);
    }
  };

  return ResourceTimeGrid;

})(FC.TimeGrid);

TimelineView = (function(superClass) {
  extend(TimelineView, superClass);

  function TimelineView() {
    return TimelineView.__super__.constructor.apply(this, arguments);
  }

  TimelineView.prototype.timeGrid = null;

  TimelineView.prototype.isScrolled = false;

  TimelineView.prototype.initialize = function() {
    this.timeGrid = this.instantiateGrid();
    return this.intervalDuration = this.timeGrid.duration;
  };

  TimelineView.prototype.instantiateGrid = function() {
    return new TimelineGrid(this);
  };

  TimelineView.prototype.setRange = function(range) {
    TimelineView.__super__.setRange.apply(this, arguments);
    return this.timeGrid.setRange(range);
  };

  TimelineView.prototype.renderSkeleton = function() {
    this.el.addClass('fc-timeline');
    if (this.opt('eventOverlap') === false) {
      this.el.addClass('fc-no-overlap');
    }
    this.el.html(this.renderSkeletonHtml());
    return this.renderTimeGridSkeleton();
  };

  TimelineView.prototype.renderSkeletonHtml = function() {
    return '<table> <thead class="fc-head"> <tr> <td class="fc-time-area ' + this.widgetHeaderClass + '"></td> </tr> </thead> <tbody class="fc-body"> <tr> <td class="fc-time-area ' + this.widgetContentClass + '"></td> </tr> </tbody> </table>';
  };

  TimelineView.prototype.renderTimeGridSkeleton = function() {
    this.timeGrid.setElement(this.el.find('tbody .fc-time-area'));
    this.timeGrid.headEl = this.el.find('thead .fc-time-area');
    this.timeGrid.renderSkeleton();
    this.isScrolled = false;
    return this.timeGrid.bodyScroller.on('scroll', proxy(this, 'handleBodyScroll'));
  };

  TimelineView.prototype.handleBodyScroll = function(top, left) {
    if (top) {
      if (!this.isScrolled) {
        this.isScrolled = true;
        return this.el.addClass('fc-scrolled');
      }
    } else {
      if (this.isScrolled) {
        this.isScrolled = false;
        return this.el.removeClass('fc-scrolled');
      }
    }
  };

  TimelineView.prototype.unrenderSkeleton = function() {
    this.timeGrid.removeElement();
    this.handleBodyScroll(0);
    return TimelineView.__super__.unrenderSkeleton.apply(this, arguments);
  };

  TimelineView.prototype.renderDates = function() {
    return this.timeGrid.renderDates();
  };

  TimelineView.prototype.unrenderDates = function() {
    return this.timeGrid.unrenderDates();
  };

  TimelineView.prototype.renderBusinessHours = function() {
    return this.timeGrid.renderBusinessHours();
  };

  TimelineView.prototype.unrenderBusinessHours = function() {
    return this.timeGrid.unrenderBusinessHours();
  };

  TimelineView.prototype.getNowIndicatorUnit = function() {
    return this.timeGrid.getNowIndicatorUnit();
  };

  TimelineView.prototype.renderNowIndicator = function(date) {
    return this.timeGrid.renderNowIndicator(date);
  };

  TimelineView.prototype.unrenderNowIndicator = function() {
    return this.timeGrid.unrenderNowIndicator();
  };

  TimelineView.prototype.hitsNeeded = function() {
    return this.timeGrid.hitsNeeded();
  };

  TimelineView.prototype.hitsNotNeeded = function() {
    return this.timeGrid.hitsNotNeeded();
  };

  TimelineView.prototype.prepareHits = function() {
    return this.timeGrid.prepareHits();
  };

  TimelineView.prototype.releaseHits = function() {
    return this.timeGrid.releaseHits();
  };

  TimelineView.prototype.queryHit = function(leftOffset, topOffset) {
    return this.timeGrid.queryHit(leftOffset, topOffset);
  };

  TimelineView.prototype.getHitSpan = function(hit) {
    return this.timeGrid.getHitSpan(hit);
  };

  TimelineView.prototype.getHitEl = function(hit) {
    return this.timeGrid.getHitEl(hit);
  };

  TimelineView.prototype.updateWidth = function() {
    return this.timeGrid.updateWidth();
  };

  TimelineView.prototype.setHeight = function(totalHeight, isAuto) {
    var bodyHeight;
    if (isAuto) {
      bodyHeight = 'auto';
    } else {
      bodyHeight = totalHeight - this.timeGrid.headHeight() - this.queryMiscHeight();
    }
    return this.timeGrid.bodyScroller.setHeight(bodyHeight);
  };

  TimelineView.prototype.queryMiscHeight = function() {
    return this.el.outerHeight() - this.timeGrid.headScroller.el.outerHeight() - this.timeGrid.bodyScroller.el.outerHeight();
  };

  TimelineView.prototype.computeInitialScroll = function() {
    var left, scrollTime;
    left = 0;
    if (this.timeGrid.isTimeScale) {
      scrollTime = this.opt('scrollTime');
      if (scrollTime) {
        scrollTime = moment.duration(scrollTime);
        left = this.timeGrid.dateToCoord(this.start.clone().time(scrollTime));
      }
    }
    return {
      left: left,
      top: 0
    };
  };

  TimelineView.prototype.queryScroll = function() {
    return {
      left: this.timeGrid.bodyScroller.getScrollLeft(),
      top: this.timeGrid.bodyScroller.getScrollTop()
    };
  };

  TimelineView.prototype.setScroll = function(scroll) {
    this.timeGrid.headScroller.setScrollLeft(scroll.left);
    this.timeGrid.bodyScroller.setScrollLeft(scroll.left);
    return this.timeGrid.bodyScroller.setScrollTop(scroll.top);
  };

  TimelineView.prototype.renderEvents = function(events) {
    this.timeGrid.renderEvents(events);
    return this.updateWidth();
  };

  TimelineView.prototype.unrenderEvents = function() {
    this.timeGrid.unrenderEvents();
    return this.updateWidth();
  };

  TimelineView.prototype.renderDrag = function(dropLocation, seg) {
    return this.timeGrid.renderDrag(dropLocation, seg);
  };

  TimelineView.prototype.unrenderDrag = function() {
    return this.timeGrid.unrenderDrag();
  };

  TimelineView.prototype.getEventSegs = function() {
    return this.timeGrid.getEventSegs();
  };

  TimelineView.prototype.renderSelection = function(range) {
    return this.timeGrid.renderSelection(range);
  };

  TimelineView.prototype.unrenderSelection = function() {
    return this.timeGrid.unrenderSelection();
  };

  return TimelineView;

})(View);

cssToStr = FC.cssToStr;

TimelineGrid = (function(superClass) {
  extend(TimelineGrid, superClass);

  TimelineGrid.prototype.slotDates = null;

  TimelineGrid.prototype.slotCnt = null;

  TimelineGrid.prototype.snapCnt = null;

  TimelineGrid.prototype.snapsPerSlot = null;

  TimelineGrid.prototype.snapDiffToIndex = null;

  TimelineGrid.prototype.snapIndexToDiff = null;

  TimelineGrid.prototype.headEl = null;

  TimelineGrid.prototype.slatContainerEl = null;

  TimelineGrid.prototype.slatEls = null;

  TimelineGrid.prototype.containerCoordCache = null;

  TimelineGrid.prototype.slatCoordCache = null;

  TimelineGrid.prototype.slatInnerCoordCache = null;

  TimelineGrid.prototype.headScroller = null;

  TimelineGrid.prototype.bodyScroller = null;

  TimelineGrid.prototype.joiner = null;

  TimelineGrid.prototype.follower = null;

  TimelineGrid.prototype.eventTitleFollower = null;

  TimelineGrid.prototype.minTime = null;

  TimelineGrid.prototype.maxTime = null;

  TimelineGrid.prototype.timeWindowMs = null;

  TimelineGrid.prototype.slotDuration = null;

  TimelineGrid.prototype.snapDuration = null;

  TimelineGrid.prototype.duration = null;

  TimelineGrid.prototype.labelInterval = null;

  TimelineGrid.prototype.headerFormats = null;

  TimelineGrid.prototype.isTimeScale = null;

  TimelineGrid.prototype.largeUnit = null;

  TimelineGrid.prototype.emphasizeWeeks = false;

  TimelineGrid.prototype.titleFollower = null;

  TimelineGrid.prototype.segContainerEl = null;

  TimelineGrid.prototype.segContainerHeight = null;

  TimelineGrid.prototype.bgSegContainerEl = null;

  TimelineGrid.prototype.helperEls = null;

  TimelineGrid.prototype.innerEl = null;

  function TimelineGrid() {
    var input;
    TimelineGrid.__super__.constructor.apply(this, arguments);
    this.initScaleProps();
    this.minTime = moment.duration(this.opt('minTime') || '00:00');
    this.maxTime = moment.duration(this.opt('maxTime') || '24:00');
    this.timeWindowMs = this.maxTime - this.minTime;
    this.snapDuration = (input = this.opt('snapDuration')) ? moment.duration(input) : this.slotDuration;
    this.minResizeDuration = this.snapDuration;
    this.snapsPerSlot = divideDurationByDuration(this.slotDuration, this.snapDuration);
    this.slotWidth = this.opt('slotWidth');
  }

  TimelineGrid.prototype.opt = function(name) {
    return this.view.opt(name);
  };

  TimelineGrid.prototype.isValidDate = function(date) {
    var ms;
    if (this.view.isHiddenDay(date)) {
      return false;
    } else if (this.isTimeScale) {
      ms = date.time() - this.minTime;
      ms = ((ms % 86400000) + 86400000) % 86400000;
      return ms < this.timeWindowMs;
    } else {
      return true;
    }
  };

  TimelineGrid.prototype.computeDisplayEventTime = function() {
    return !this.isTimeScale;
  };

  TimelineGrid.prototype.computeDisplayEventEnd = function() {
    return false;
  };

  TimelineGrid.prototype.computeEventTimeFormat = function() {
    return this.opt('extraSmallTimeFormat');
  };


  /*
  	Makes the given date consistent with isTimeScale/largeUnit,
  	so, either removes the times, ensures a time, or makes it the startOf largeUnit.
  	Strips all timezones. Returns new copy.
  	TODO: should maybe be called "normalizeRangeDate".
   */

  TimelineGrid.prototype.normalizeGridDate = function(date) {
    var normalDate;
    if (this.isTimeScale) {
      normalDate = date.clone();
      if (!normalDate.hasTime()) {
        normalDate.time(0);
      }
    } else {
      normalDate = date.clone().stripTime();
      if (this.largeUnit) {
        normalDate.startOf(this.largeUnit);
      }
    }
    return normalDate;
  };

  TimelineGrid.prototype.normalizeGridRange = function(range) {
    var adjustedEnd, normalRange;
    if (this.isTimeScale) {
      normalRange = {
        start: this.normalizeGridDate(range.start),
        end: this.normalizeGridDate(range.end)
      };
    } else {
      normalRange = this.view.computeDayRange(range);
      if (this.largeUnit) {
        normalRange.start.startOf(this.largeUnit);
        adjustedEnd = normalRange.end.clone().startOf(this.largeUnit);
        if (!adjustedEnd.isSame(normalRange.end) || !adjustedEnd.isAfter(normalRange.start)) {
          adjustedEnd.add(this.slotDuration);
        }
        normalRange.end = adjustedEnd;
      }
    }
    return normalRange;
  };

  TimelineGrid.prototype.rangeUpdated = function() {
    var date, slotDates;
    this.start = this.normalizeGridDate(this.start);
    this.end = this.normalizeGridDate(this.end);
    if (this.isTimeScale) {
      this.start.add(this.minTime);
      this.end.subtract(1, 'day').add(this.maxTime);
    }
    slotDates = [];
    date = this.start.clone();
    while (date < this.end) {
      if (this.isValidDate(date)) {
        slotDates.push(date.clone());
      }
      date.add(this.slotDuration);
    }
    this.slotDates = slotDates;
    return this.updateGridDates();
  };

  TimelineGrid.prototype.updateGridDates = function() {
    var date, snapDiff, snapDiffToIndex, snapIndex, snapIndexToDiff;
    snapIndex = -1;
    snapDiff = 0;
    snapDiffToIndex = [];
    snapIndexToDiff = [];
    date = this.start.clone();
    while (date < this.end) {
      if (this.isValidDate(date)) {
        snapIndex++;
        snapDiffToIndex.push(snapIndex);
        snapIndexToDiff.push(snapDiff);
      } else {
        snapDiffToIndex.push(snapIndex + 0.5);
      }
      date.add(this.snapDuration);
      snapDiff++;
    }
    this.snapDiffToIndex = snapDiffToIndex;
    this.snapIndexToDiff = snapIndexToDiff;
    this.snapCnt = snapIndex + 1;
    return this.slotCnt = this.snapCnt / this.snapsPerSlot;
  };

  TimelineGrid.prototype.spanToSegs = function(span) {
    var normalRange, seg;
    normalRange = this.normalizeGridRange(span);
    if (this.computeDateSnapCoverage(span.start) < this.computeDateSnapCoverage(span.end)) {
      seg = intersectRanges(normalRange, this);
      if (seg) {
        if (seg.isStart && !this.isValidDate(seg.start)) {
          seg.isStart = false;
        }
        if (seg.isEnd && seg.end && !this.isValidDate(seg.end.clone().subtract(1))) {
          seg.isEnd = false;
        }
        return [seg];
      }
    }
    return [];
  };

  TimelineGrid.prototype.prepareHits = function() {
    return this.buildCoords();
  };

  TimelineGrid.prototype.queryHit = function(leftOffset, topOffset) {
    var containerCoordCache, localSnapIndex, partial, slatCoordCache, slatIndex, slatLeft, slatRight, slatWidth, snapIndex, snapLeft, snapRight, snapsPerSlot;
    snapsPerSlot = this.snapsPerSlot;
    slatCoordCache = this.slatCoordCache;
    containerCoordCache = this.containerCoordCache;
    if (containerCoordCache.isPointInBounds(leftOffset, topOffset)) {
      slatIndex = slatCoordCache.getHorizontalIndex(leftOffset);
      if (slatIndex != null) {
        slatWidth = slatCoordCache.getWidth(slatIndex);
        if (this.isRTL) {
          slatRight = slatCoordCache.getRightOffset(slatIndex);
          partial = (slatRight - leftOffset) / slatWidth;
          localSnapIndex = Math.floor(partial * snapsPerSlot);
          snapIndex = slatIndex * snapsPerSlot + localSnapIndex;
          snapRight = slatRight - (localSnapIndex / snapsPerSlot) * slatWidth;
          snapLeft = snapRight - ((localSnapIndex + 1) / snapsPerSlot) * slatWidth;
        } else {
          slatLeft = slatCoordCache.getLeftOffset(slatIndex);
          partial = (leftOffset - slatLeft) / slatWidth;
          localSnapIndex = Math.floor(partial * snapsPerSlot);
          snapIndex = slatIndex * snapsPerSlot + localSnapIndex;
          snapLeft = slatLeft + (localSnapIndex / snapsPerSlot) * slatWidth;
          snapRight = slatLeft + ((localSnapIndex + 1) / snapsPerSlot) * slatWidth;
        }
        return {
          snap: snapIndex,
          component: this,
          left: snapLeft,
          right: snapRight,
          top: containerCoordCache.getTopOffset(0),
          bottom: containerCoordCache.getBottomOffset(0)
        };
      }
    }
  };

  TimelineGrid.prototype.getHitSpan = function(hit) {
    return this.getSnapRange(hit.snap);
  };

  TimelineGrid.prototype.getHitEl = function(hit) {
    return this.getSnapEl(hit.snap);
  };

  TimelineGrid.prototype.getSnapRange = function(snapIndex) {
    var end, start;
    start = this.start.clone();
    start.add(multiplyDuration(this.snapDuration, this.snapIndexToDiff[snapIndex]));
    end = start.clone().add(this.snapDuration);
    return {
      start: start,
      end: end
    };
  };

  TimelineGrid.prototype.getSnapEl = function(snapIndex) {
    return this.slatEls.eq(Math.floor(snapIndex / this.snapsPerSlot));
  };

  TimelineGrid.prototype.renderSkeleton = function() {
    this.headScroller = new ClippedScroller({
      overflowX: 'clipped-scroll',
      overflowY: 'hidden'
    });
    this.headScroller.canvas = new ScrollerCanvas();
    this.headScroller.render();
    this.headEl.append(this.headScroller.el);
    this.bodyScroller = new ClippedScroller();
    this.bodyScroller.canvas = new ScrollerCanvas();
    this.bodyScroller.render();
    this.el.append(this.bodyScroller.el);
    this.innerEl = this.bodyScroller.canvas.contentEl;
    this.slatContainerEl = $('<div class="fc-slats"/>').appendTo(this.bodyScroller.canvas.bgEl);
    this.segContainerEl = $('<div class="fc-event-container"/>').appendTo(this.bodyScroller.canvas.contentEl);
    this.bgSegContainerEl = this.bodyScroller.canvas.bgEl;
    this.containerCoordCache = new CoordCache({
      els: this.bodyScroller.canvas.el,
      isHorizontal: true,
      isVertical: true
    });
    this.joiner = new ScrollJoiner('horizontal', [this.headScroller, this.bodyScroller]);
    if (true) {
      this.follower = new ScrollFollower(this.headScroller, true);
    }
    if (true) {
      this.eventTitleFollower = new ScrollFollower(this.bodyScroller);
      this.eventTitleFollower.minTravel = 50;
      if (this.isRTL) {
        this.eventTitleFollower.containOnNaturalRight = true;
      } else {
        this.eventTitleFollower.containOnNaturalLeft = true;
      }
    }
    return TimelineGrid.__super__.renderSkeleton.apply(this, arguments);
  };

  TimelineGrid.prototype.headColEls = null;

  TimelineGrid.prototype.slatColEls = null;

  TimelineGrid.prototype.renderDates = function() {
    var date, i, j, len, ref;
    this.headScroller.canvas.contentEl.html(this.renderHeadHtml());
    this.headColEls = this.headScroller.canvas.contentEl.find('col');
    this.slatContainerEl.html(this.renderSlatHtml());
    this.slatColEls = this.slatContainerEl.find('col');
    this.slatEls = this.slatContainerEl.find('td');
    this.slatCoordCache = new CoordCache({
      els: this.slatEls,
      isHorizontal: true
    });
    this.slatInnerCoordCache = new CoordCache({
      els: this.slatEls.find('> div'),
      isHorizontal: true,
      offsetParent: this.bodyScroller.canvas.el
    });
    ref = this.slotDates;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      date = ref[i];
      this.view.publiclyTrigger('dayRender', null, date, this.slatEls.eq(i));
    }
    if (this.follower) {
      return this.follower.setSprites(this.headEl.find('tr:not(:last-child) .fc-cell-text'));
    }
  };

  TimelineGrid.prototype.unrenderDates = function() {
    if (this.follower) {
      this.follower.clearSprites();
    }
    this.headScroller.canvas.contentEl.empty();
    this.slatContainerEl.empty();
    this.headScroller.canvas.clearWidth();
    return this.bodyScroller.canvas.clearWidth();
  };

  TimelineGrid.prototype.renderHeadHtml = function() {
    var cell, cellRows, date, format, formats, headerCellClassNames, html, i, isChrono, isLast, isSingleDay, isSuperRow, isWeekStart, j, k, l, labelInterval, leadingCell, len, len1, len2, len3, len4, len5, len6, m, n, newCell, p, prevWeekNumber, q, row, rowCells, rowUnits, slatHtml, slotCells, slotDates, text, weekNumber;
    labelInterval = this.labelInterval;
    formats = this.headerFormats;
    cellRows = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = formats.length; j < len; j++) {
        format = formats[j];
        results.push([]);
      }
      return results;
    })();
    leadingCell = null;
    prevWeekNumber = null;
    slotDates = this.slotDates;
    slotCells = [];
    rowUnits = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = formats.length; j < len; j++) {
        format = formats[j];
        results.push(FC.queryMostGranularFormatUnit(format));
      }
      return results;
    })();
    for (j = 0, len = slotDates.length; j < len; j++) {
      date = slotDates[j];
      weekNumber = date.week();
      isWeekStart = this.emphasizeWeeks && prevWeekNumber !== null && prevWeekNumber !== weekNumber;
      for (row = k = 0, len1 = formats.length; k < len1; row = ++k) {
        format = formats[row];
        rowCells = cellRows[row];
        leadingCell = rowCells[rowCells.length - 1];
        isSuperRow = formats.length > 1 && row < formats.length - 1;
        newCell = null;
        if (isSuperRow) {
          text = date.format(format);
          if (!leadingCell || leadingCell.text !== text) {
            newCell = this.buildCellObject(date, text, rowUnits[row]);
          } else {
            leadingCell.colspan += 1;
          }
        } else {
          if (!leadingCell || isInt(divideRangeByDuration(this.start, date, labelInterval))) {
            text = date.format(format);
            newCell = this.buildCellObject(date, text, rowUnits[row]);
          } else {
            leadingCell.colspan += 1;
          }
        }
        if (newCell) {
          newCell.weekStart = isWeekStart;
          rowCells.push(newCell);
        }
      }
      slotCells.push({
        weekStart: isWeekStart
      });
      prevWeekNumber = weekNumber;
    }
    isChrono = labelInterval > this.slotDuration;
    isSingleDay = this.slotDuration.as('days') === 1;
    html = '<table>';
    html += '<colgroup>';
    for (l = 0, len2 = slotDates.length; l < len2; l++) {
      date = slotDates[l];
      html += '<col/>';
    }
    html += '</colgroup>';
    html += '<tbody>';
    for (i = m = 0, len3 = cellRows.length; m < len3; i = ++m) {
      rowCells = cellRows[i];
      isLast = i === cellRows.length - 1;
      html += '<tr' + (isChrono && isLast ? ' class="fc-chrono"' : '') + '>';
      for (n = 0, len4 = rowCells.length; n < len4; n++) {
        cell = rowCells[n];
        headerCellClassNames = [this.view.widgetHeaderClass];
        if (cell.weekStart) {
          headerCellClassNames.push('fc-em-cell');
        }
        if (isSingleDay) {
          headerCellClassNames = headerCellClassNames.concat(this.getDayClasses(cell.date, true));
        }
        html += '<th class="' + headerCellClassNames.join(' ') + '"' + ' data-date="' + cell.date.format() + '"' + (cell.colspan > 1 ? ' colspan="' + cell.colspan + '"' : '') + '>' + '<div class="fc-cell-content">' + cell.spanHtml + '</div>' + '</th>';
      }
      html += '</tr>';
    }
    html += '</tbody></table>';
    slatHtml = '<table>';
    slatHtml += '<colgroup>';
    for (p = 0, len5 = slotCells.length; p < len5; p++) {
      cell = slotCells[p];
      slatHtml += '<col/>';
    }
    slatHtml += '</colgroup>';
    slatHtml += '<tbody><tr>';
    for (i = q = 0, len6 = slotCells.length; q < len6; i = ++q) {
      cell = slotCells[i];
      date = slotDates[i];
      slatHtml += this.slatCellHtml(date, cell.weekStart);
    }
    slatHtml += '</tr></tbody></table>';
    this._slatHtml = slatHtml;
    return html;
  };

  TimelineGrid.prototype.buildCellObject = function(date, text, rowUnit) {
    var spanHtml;
    date = date.clone();
    spanHtml = this.view.buildGotoAnchorHtml({
      date: date,
      type: rowUnit,
      forceOff: !rowUnit
    }, {
      'class': 'fc-cell-text'
    }, htmlEscape(text));
    return {
      text: text,
      spanHtml: spanHtml,
      date: date,
      colspan: 1
    };
  };

  TimelineGrid.prototype.renderSlatHtml = function() {
    return this._slatHtml;
  };

  TimelineGrid.prototype.slatCellHtml = function(date, isEm) {
    var classes;
    if (this.isTimeScale) {
      classes = [];
      classes.push(isInt(divideRangeByDuration(this.start, date, this.labelInterval)) ? 'fc-major' : 'fc-minor');
    } else {
      classes = this.getDayClasses(date);
      classes.push('fc-day');
    }
    classes.unshift(this.view.widgetContentClass);
    if (isEm) {
      classes.push('fc-em-cell');
    }
    return '<td class="' + classes.join(' ') + '"' + ' data-date="' + date.format() + '"' + '><div /></td>';
  };

  TimelineGrid.prototype.businessHourSegs = null;

  TimelineGrid.prototype.renderBusinessHours = function() {
    var segs;
    if (!this.largeUnit) {
      segs = this.businessHourSegs = this.buildBusinessHourSegs(!this.isTimeScale);
      return this.renderFill('businessHours', segs, 'bgevent');
    }
  };

  TimelineGrid.prototype.unrenderBusinessHours = function() {
    return this.unrenderFill('businessHours');
  };

  TimelineGrid.prototype.nowIndicatorEls = null;

  TimelineGrid.prototype.getNowIndicatorUnit = function() {
    if (this.isTimeScale) {
      return computeIntervalUnit(this.slotDuration);
    }
  };

  TimelineGrid.prototype.renderNowIndicator = function(date) {
    var coord, css, nodes;
    nodes = [];
    date = this.normalizeGridDate(date);
    if (date >= this.start && date < this.end) {
      coord = this.dateToCoord(date);
      css = this.isRTL ? {
        right: -coord
      } : {
        left: coord
      };
      nodes.push($("<div class='fc-now-indicator fc-now-indicator-arrow'></div>").css(css).appendTo(this.headScroller.canvas.el)[0]);
      nodes.push($("<div class='fc-now-indicator fc-now-indicator-line'></div>").css(css).appendTo(this.bodyScroller.canvas.el)[0]);
    }
    return this.nowIndicatorEls = $(nodes);
  };

  TimelineGrid.prototype.unrenderNowIndicator = function() {
    if (this.nowIndicatorEls) {
      this.nowIndicatorEls.remove();
      return this.nowIndicatorEls = null;
    }
  };

  TimelineGrid.prototype.explicitSlotWidth = null;

  TimelineGrid.prototype.defaultSlotWidth = null;

  TimelineGrid.prototype.updateWidth = function() {
    var availableWidth, containerMinWidth, containerWidth, isDatesRendered, nonLastSlotWidth, slotWidth;
    isDatesRendered = this.headColEls;
    if (isDatesRendered) {
      slotWidth = Math.round(this.slotWidth || (this.slotWidth = this.computeSlotWidth()));
      containerWidth = slotWidth * this.slotDates.length;
      containerMinWidth = '';
      nonLastSlotWidth = slotWidth;
      availableWidth = this.bodyScroller.getClientWidth();
      if (availableWidth > containerWidth) {
        containerMinWidth = availableWidth;
        containerWidth = '';
        nonLastSlotWidth = Math.floor(availableWidth / this.slotDates.length);
      }
    } else {
      containerWidth = '';
      containerMinWidth = '';
    }
    this.headScroller.canvas.setWidth(containerWidth);
    this.headScroller.canvas.setMinWidth(containerMinWidth);
    this.bodyScroller.canvas.setWidth(containerWidth);
    this.bodyScroller.canvas.setMinWidth(containerMinWidth);
    if (isDatesRendered) {
      this.headColEls.slice(0, -1).add(this.slatColEls.slice(0, -1)).width(nonLastSlotWidth);
    }
    this.headScroller.updateSize();
    this.bodyScroller.updateSize();
    this.joiner.update();
    if (isDatesRendered) {
      this.buildCoords();
      this.updateSegPositions();
      this.view.updateNowIndicator();
    }
    if (this.follower) {
      this.follower.update();
    }
    if (this.eventTitleFollower) {
      return this.eventTitleFollower.update();
    }
  };

  TimelineGrid.prototype.computeSlotWidth = function() {
    var headerWidth, innerEls, maxInnerWidth, minWidth, slotWidth, slotsPerLabel;
    maxInnerWidth = 0;
    innerEls = this.headEl.find('tr:last-child th .fc-cell-text');
    innerEls.each(function(i, node) {
      var innerWidth;
      innerWidth = $(node).outerWidth();
      return maxInnerWidth = Math.max(maxInnerWidth, innerWidth);
    });
    headerWidth = maxInnerWidth + 1;
    slotsPerLabel = divideDurationByDuration(this.labelInterval, this.slotDuration);
    slotWidth = Math.ceil(headerWidth / slotsPerLabel);
    minWidth = this.headColEls.eq(0).css('min-width');
    if (minWidth) {
      minWidth = parseInt(minWidth, 10);
      if (minWidth) {
        slotWidth = Math.max(slotWidth, minWidth);
      }
    }
    return slotWidth;
  };

  TimelineGrid.prototype.buildCoords = function() {
    this.containerCoordCache.build();
    this.slatCoordCache.build();
    return this.slatInnerCoordCache.build();
  };

  TimelineGrid.prototype.computeDateSnapCoverage = function(date) {
    var snapCoverage, snapDiff, snapDiffInt;
    snapDiff = divideRangeByDuration(this.start, date, this.snapDuration);
    if (snapDiff < 0) {
      return 0;
    } else if (snapDiff >= this.snapDiffToIndex.length) {
      return this.snapCnt;
    } else {
      snapDiffInt = Math.floor(snapDiff);
      snapCoverage = this.snapDiffToIndex[snapDiffInt];
      if (isInt(snapCoverage)) {
        snapCoverage += snapDiff - snapDiffInt;
      } else {
        snapCoverage = Math.ceil(snapCoverage);
      }
      return snapCoverage;
    }
  };

  TimelineGrid.prototype.dateToCoord = function(date) {
    var coordCache, partial, slotCoverage, slotIndex, snapCoverage;
    snapCoverage = this.computeDateSnapCoverage(date);
    slotCoverage = snapCoverage / this.snapsPerSlot;
    slotIndex = Math.floor(slotCoverage);
    slotIndex = Math.min(slotIndex, this.slotCnt - 1);
    partial = slotCoverage - slotIndex;
    coordCache = this.slatInnerCoordCache;
    if (this.isRTL) {
      return (coordCache.getRightPosition(slotIndex) - coordCache.getWidth(slotIndex) * partial) - this.containerCoordCache.getWidth(0);
    } else {
      return coordCache.getLeftPosition(slotIndex) + coordCache.getWidth(slotIndex) * partial;
    }
  };

  TimelineGrid.prototype.rangeToCoords = function(range) {
    if (this.isRTL) {
      return {
        right: this.dateToCoord(range.start),
        left: this.dateToCoord(range.end)
      };
    } else {
      return {
        left: this.dateToCoord(range.start),
        right: this.dateToCoord(range.end)
      };
    }
  };

  TimelineGrid.prototype.headHeight = function() {
    var table;
    table = this.headScroller.canvas.contentEl.find('table');
    return table.height.apply(table, arguments);
  };

  TimelineGrid.prototype.updateSegPositions = function() {
    var coords, j, len, seg, segs;
    segs = (this.segs || []).concat(this.businessHourSegs || []);
    for (j = 0, len = segs.length; j < len; j++) {
      seg = segs[j];
      coords = this.rangeToCoords(seg);
      seg.el.css({
        left: (seg.left = coords.left),
        right: -(seg.right = coords.right)
      });
    }
  };

  TimelineGrid.prototype.renderFgSegs = function(segs) {
    segs = this.renderFgSegEls(segs);
    this.renderFgSegsInContainers([[this, segs]]);
    this.updateSegFollowers(segs);
    return segs;
  };

  TimelineGrid.prototype.unrenderFgSegs = function() {
    this.clearSegFollowers();
    return this.unrenderFgContainers([this]);
  };

  TimelineGrid.prototype.renderFgSegsInContainers = function(pairs) {
    var container, coords, j, k, l, len, len1, len2, len3, len4, len5, len6, len7, m, n, p, q, r, ref, ref1, ref2, ref3, results, seg, segs;
    for (j = 0, len = pairs.length; j < len; j++) {
      ref = pairs[j], container = ref[0], segs = ref[1];
      for (k = 0, len1 = segs.length; k < len1; k++) {
        seg = segs[k];
        coords = this.rangeToCoords(seg);
        seg.el.css({
          left: (seg.left = coords.left),
          right: -(seg.right = coords.right)
        });
      }
    }
    for (l = 0, len2 = pairs.length; l < len2; l++) {
      ref1 = pairs[l], container = ref1[0], segs = ref1[1];
      for (m = 0, len3 = segs.length; m < len3; m++) {
        seg = segs[m];
        seg.el.appendTo(container.segContainerEl);
      }
    }
    for (n = 0, len4 = pairs.length; n < len4; n++) {
      ref2 = pairs[n], container = ref2[0], segs = ref2[1];
      for (p = 0, len5 = segs.length; p < len5; p++) {
        seg = segs[p];
        seg.height = seg.el.outerHeight(true);
      }
      this.buildSegLevels(segs);
      container.segContainerHeight = computeOffsetForSegs(segs);
    }
    results = [];
    for (q = 0, len6 = pairs.length; q < len6; q++) {
      ref3 = pairs[q], container = ref3[0], segs = ref3[1];
      for (r = 0, len7 = segs.length; r < len7; r++) {
        seg = segs[r];
        seg.el.css('top', seg.top);
      }
      results.push(container.segContainerEl.height(container.segContainerHeight));
    }
    return results;
  };

  TimelineGrid.prototype.buildSegLevels = function(segs) {
    var belowSeg, isLevelCollision, j, k, l, len, len1, len2, level, placedSeg, ref, ref1, segLevels, unplacedSeg;
    segLevels = [];
    this.sortEventSegs(segs);
    for (j = 0, len = segs.length; j < len; j++) {
      unplacedSeg = segs[j];
      unplacedSeg.above = [];
      level = 0;
      while (level < segLevels.length) {
        isLevelCollision = false;
        ref = segLevels[level];
        for (k = 0, len1 = ref.length; k < len1; k++) {
          placedSeg = ref[k];
          if (timeRowSegsCollide(unplacedSeg, placedSeg)) {
            unplacedSeg.above.push(placedSeg);
            isLevelCollision = true;
          }
        }
        if (isLevelCollision) {
          level += 1;
        } else {
          break;
        }
      }
      (segLevels[level] || (segLevels[level] = [])).push(unplacedSeg);
      level += 1;
      while (level < segLevels.length) {
        ref1 = segLevels[level];
        for (l = 0, len2 = ref1.length; l < len2; l++) {
          belowSeg = ref1[l];
          if (timeRowSegsCollide(unplacedSeg, belowSeg)) {
            belowSeg.above.push(unplacedSeg);
          }
        }
        level += 1;
      }
    }
    return segLevels;
  };

  TimelineGrid.prototype.unrenderFgContainers = function(containers) {
    var container, j, len, results;
    results = [];
    for (j = 0, len = containers.length; j < len; j++) {
      container = containers[j];
      container.segContainerEl.empty();
      container.segContainerEl.height('');
      results.push(container.segContainerHeight = null);
    }
    return results;
  };

  TimelineGrid.prototype.fgSegHtml = function(seg, disableResizing) {
    var classes, event, isDraggable, isResizableFromEnd, isResizableFromStart, timeText;
    event = seg.event;
    isDraggable = this.view.isEventDraggable(event);
    isResizableFromStart = seg.isStart && this.view.isEventResizableFromStart(event);
    isResizableFromEnd = seg.isEnd && this.view.isEventResizableFromEnd(event);
    classes = this.getSegClasses(seg, isDraggable, isResizableFromStart || isResizableFromEnd);
    classes.unshift('fc-timeline-event', 'fc-h-event');
    timeText = this.getEventTimeText(event);
    return '<a class="' + classes.join(' ') + '" style="' + cssToStr(this.getSegSkinCss(seg)) + '"' + (event.url ? ' href="' + htmlEscape(event.url) + '"' : '') + '>' + '<div class="fc-content">' + (timeText ? '<span class="fc-time">' + htmlEscape(timeText) + '</span>' : '') + '<span class="fc-title">' + (event.title ? htmlEscape(event.title) : '&nbsp;') + '</span>' + '</div>' + '<div class="fc-bg" />' + (isResizableFromStart ? '<div class="fc-resizer fc-start-resizer"></div>' : '') + (isResizableFromEnd ? '<div class="fc-resizer fc-end-resizer"></div>' : '') + '</a>';
  };

  TimelineGrid.prototype.updateSegFollowers = function(segs) {
    var j, len, seg, sprites, titleEl;
    if (this.eventTitleFollower) {
      sprites = [];
      for (j = 0, len = segs.length; j < len; j++) {
        seg = segs[j];
        titleEl = seg.el.find('.fc-title');
        if (titleEl.length) {
          sprites.push(new ScrollFollowerSprite(titleEl));
        }
      }
      return this.eventTitleFollower.setSprites(sprites);
    }
  };

  TimelineGrid.prototype.clearSegFollowers = function() {
    if (this.eventTitleFollower) {
      return this.eventTitleFollower.clearSprites();
    }
  };

  TimelineGrid.prototype.segDragStart = function() {
    TimelineGrid.__super__.segDragStart.apply(this, arguments);
    if (this.eventTitleFollower) {
      return this.eventTitleFollower.forceRelative();
    }
  };

  TimelineGrid.prototype.segDragEnd = function() {
    TimelineGrid.__super__.segDragEnd.apply(this, arguments);
    if (this.eventTitleFollower) {
      return this.eventTitleFollower.clearForce();
    }
  };

  TimelineGrid.prototype.segResizeStart = function() {
    TimelineGrid.__super__.segResizeStart.apply(this, arguments);
    if (this.eventTitleFollower) {
      return this.eventTitleFollower.forceRelative();
    }
  };

  TimelineGrid.prototype.segResizeEnd = function() {
    TimelineGrid.__super__.segResizeEnd.apply(this, arguments);
    if (this.eventTitleFollower) {
      return this.eventTitleFollower.clearForce();
    }
  };

  TimelineGrid.prototype.renderHelper = function(event, sourceSeg) {
    var segs;
    segs = this.eventToSegs(event);
    segs = this.renderFgSegEls(segs);
    return this.renderHelperSegsInContainers([[this, segs]], sourceSeg);
  };

  TimelineGrid.prototype.renderHelperSegsInContainers = function(pairs, sourceSeg) {
    var containerObj, coords, helperContainerEl, helperNodes, j, k, l, len, len1, len2, len3, m, ref, ref1, ref2, seg, segNodes, segs;
    helperNodes = [];
    segNodes = [];
    for (j = 0, len = pairs.length; j < len; j++) {
      ref = pairs[j], containerObj = ref[0], segs = ref[1];
      for (k = 0, len1 = segs.length; k < len1; k++) {
        seg = segs[k];
        coords = this.rangeToCoords(seg);
        seg.el.css({
          left: (seg.left = coords.left),
          right: -(seg.right = coords.right)
        });
        if (sourceSeg && sourceSeg.resourceId === ((ref1 = containerObj.resource) != null ? ref1.id : void 0)) {
          seg.el.css('top', sourceSeg.el.css('top'));
        } else {
          seg.el.css('top', 0);
        }
      }
    }
    for (l = 0, len2 = pairs.length; l < len2; l++) {
      ref2 = pairs[l], containerObj = ref2[0], segs = ref2[1];
      helperContainerEl = $('<div class="fc-event-container fc-helper-container"/>').appendTo(containerObj.innerEl);
      helperNodes.push(helperContainerEl[0]);
      for (m = 0, len3 = segs.length; m < len3; m++) {
        seg = segs[m];
        helperContainerEl.append(seg.el);
        segNodes.push(seg.el[0]);
      }
    }
    if (this.helperEls) {
      this.helperEls = this.helperEls.add($(helperNodes));
    } else {
      this.helperEls = $(helperNodes);
    }
    return $(segNodes);
  };

  TimelineGrid.prototype.unrenderHelper = function() {
    if (this.helperEls) {
      this.helperEls.remove();
      return this.helperEls = null;
    }
  };

  TimelineGrid.prototype.renderEventResize = function(resizeLocation, seg) {
    this.renderHighlight(this.eventToSpan(resizeLocation));
    return this.renderEventLocationHelper(resizeLocation, seg);
  };

  TimelineGrid.prototype.unrenderEventResize = function() {
    this.unrenderHighlight();
    return this.unrenderHelper();
  };

  TimelineGrid.prototype.renderFill = function(type, segs, className) {
    segs = this.renderFillSegEls(type, segs);
    this.renderFillInContainers(type, [[this, segs]], className);
    return segs;
  };

  TimelineGrid.prototype.renderFillInContainers = function(type, pairs, className) {
    var containerObj, j, len, ref, results, segs;
    results = [];
    for (j = 0, len = pairs.length; j < len; j++) {
      ref = pairs[j], containerObj = ref[0], segs = ref[1];
      results.push(this.renderFillInContainer(type, containerObj, segs, className));
    }
    return results;
  };

  TimelineGrid.prototype.renderFillInContainer = function(type, containerObj, segs, className) {
    var containerEl, coords, j, len, seg;
    if (segs.length) {
      className || (className = type.toLowerCase());
      containerEl = $('<div class="fc-' + className + '-container" />').appendTo(containerObj.bgSegContainerEl);
      for (j = 0, len = segs.length; j < len; j++) {
        seg = segs[j];
        coords = this.rangeToCoords(seg);
        seg.el.css({
          left: (seg.left = coords.left),
          right: -(seg.right = coords.right)
        });
        seg.el.appendTo(containerEl);
      }
      if (this.elsByFill[type]) {
        return this.elsByFill[type] = this.elsByFill[type].add(containerEl);
      } else {
        return this.elsByFill[type] = containerEl;
      }
    }
  };

  TimelineGrid.prototype.renderDrag = function(dropLocation, seg) {
    if (seg) {
      return this.renderEventLocationHelper(dropLocation, seg);
    } else {
      this.renderHighlight(this.eventToSpan(dropLocation));
      return null;
    }
  };

  TimelineGrid.prototype.unrenderDrag = function() {
    this.unrenderHelper();
    return this.unrenderHighlight();
  };

  return TimelineGrid;

})(Grid);

computeOffsetForSegs = function(segs) {
  var j, len, max, seg;
  max = 0;
  for (j = 0, len = segs.length; j < len; j++) {
    seg = segs[j];
    max = Math.max(max, computeOffsetForSeg(seg));
  }
  return max;
};

computeOffsetForSeg = function(seg) {
  if (seg.top == null) {
    seg.top = computeOffsetForSegs(seg.above);
  }
  return seg.top + seg.height;
};

timeRowSegsCollide = function(seg0, seg1) {
  return seg0.left < seg1.right && seg0.right > seg1.left;
};

MIN_AUTO_LABELS = 18;

MAX_AUTO_SLOTS_PER_LABEL = 6;

MAX_AUTO_CELLS = 200;

MAX_CELLS = 1000;

DEFAULT_GRID_DURATION = {
  months: 1
};

STOCK_SUB_DURATIONS = [
  {
    years: 1
  }, {
    months: 1
  }, {
    days: 1
  }, {
    hours: 1
  }, {
    minutes: 30
  }, {
    minutes: 15
  }, {
    minutes: 10
  }, {
    minutes: 5
  }, {
    minutes: 1
  }, {
    seconds: 30
  }, {
    seconds: 15
  }, {
    seconds: 10
  }, {
    seconds: 5
  }, {
    seconds: 1
  }, {
    milliseconds: 500
  }, {
    milliseconds: 100
  }, {
    milliseconds: 10
  }, {
    milliseconds: 1
  }
];

TimelineGrid.prototype.initScaleProps = function() {
  var input, slotUnit, type;
  this.labelInterval = this.queryDurationOption('slotLabelInterval');
  this.slotDuration = this.queryDurationOption('slotDuration');
  this.ensureGridDuration();
  this.validateLabelAndSlot();
  this.ensureLabelInterval();
  this.ensureSlotDuration();
  input = this.opt('slotLabelFormat');
  type = $.type(input);
  this.headerFormats = type === 'array' ? input : type === 'string' ? [input] : this.computeHeaderFormats();
  this.isTimeScale = durationHasTime(this.slotDuration);
  this.largeUnit = !this.isTimeScale ? (slotUnit = computeIntervalUnit(this.slotDuration), /year|month|week/.test(slotUnit) ? slotUnit : void 0) : void 0;
  return this.emphasizeWeeks = this.slotDuration.as('days') === 1 && this.duration.as('weeks') >= 2 && !this.opt('businessHours');

  /*
  	console.log('view duration =', @duration.humanize())
  	console.log('label interval =', @labelInterval.humanize())
  	console.log('slot duration =', @slotDuration.humanize())
  	console.log('header formats =', @headerFormats)
  	console.log('isTimeScale', @isTimeScale)
  	console.log('largeUnit', @largeUnit)
   */
};

TimelineGrid.prototype.queryDurationOption = function(name) {
  var dur, input;
  input = this.opt(name);
  if (input != null) {
    dur = moment.duration(input);
    if (+dur) {
      return dur;
    }
  }
};

TimelineGrid.prototype.validateLabelAndSlot = function() {
  var labelCnt, slotCnt, slotsPerLabel;
  if (this.labelInterval) {
    labelCnt = divideDurationByDuration(this.duration, this.labelInterval);
    if (labelCnt > MAX_CELLS) {
      FC.warn('slotLabelInterval results in too many cells');
      this.labelInterval = null;
    }
  }
  if (this.slotDuration) {
    slotCnt = divideDurationByDuration(this.duration, this.slotDuration);
    if (slotCnt > MAX_CELLS) {
      FC.warn('slotDuration results in too many cells');
      this.slotDuration = null;
    }
  }
  if (this.labelInterval && this.slotDuration) {
    slotsPerLabel = divideDurationByDuration(this.labelInterval, this.slotDuration);
    if (!isInt(slotsPerLabel) || slotsPerLabel < 1) {
      FC.warn('slotLabelInterval must be a multiple of slotDuration');
      return this.slotDuration = null;
    }
  }
};

TimelineGrid.prototype.ensureGridDuration = function() {
  var gridDuration, input, j, labelCnt, labelInterval;
  gridDuration = this.duration;
  if (!gridDuration) {
    gridDuration = this.view.intervalDuration;
    if (!gridDuration) {
      if (!this.labelInterval && !this.slotDuration) {
        gridDuration = moment.duration(DEFAULT_GRID_DURATION);
      } else {
        labelInterval = this.ensureLabelInterval();
        for (j = STOCK_SUB_DURATIONS.length - 1; j >= 0; j += -1) {
          input = STOCK_SUB_DURATIONS[j];
          gridDuration = moment.duration(input);
          labelCnt = divideDurationByDuration(gridDuration, labelInterval);
          if (labelCnt >= MIN_AUTO_LABELS) {
            break;
          }
        }
      }
    }
    this.duration = gridDuration;
  }
  return gridDuration;
};

TimelineGrid.prototype.ensureLabelInterval = function() {
  var input, j, k, labelCnt, labelInterval, len, len1, slotsPerLabel, tryLabelInterval;
  labelInterval = this.labelInterval;
  if (!labelInterval) {
    if (!this.duration && !this.slotDuration) {
      this.ensureGridDuration();
    }
    if (this.slotDuration) {
      for (j = 0, len = STOCK_SUB_DURATIONS.length; j < len; j++) {
        input = STOCK_SUB_DURATIONS[j];
        tryLabelInterval = moment.duration(input);
        slotsPerLabel = divideDurationByDuration(tryLabelInterval, this.slotDuration);
        if (isInt(slotsPerLabel) && slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL) {
          labelInterval = tryLabelInterval;
          break;
        }
      }
      if (!labelInterval) {
        labelInterval = this.slotDuration;
      }
    } else {
      for (k = 0, len1 = STOCK_SUB_DURATIONS.length; k < len1; k++) {
        input = STOCK_SUB_DURATIONS[k];
        labelInterval = moment.duration(input);
        labelCnt = divideDurationByDuration(this.duration, labelInterval);
        if (labelCnt >= MIN_AUTO_LABELS) {
          break;
        }
      }
    }
    this.labelInterval = labelInterval;
  }
  return labelInterval;
};

TimelineGrid.prototype.ensureSlotDuration = function() {
  var input, j, labelInterval, len, slotCnt, slotDuration, slotsPerLabel, trySlotDuration;
  slotDuration = this.slotDuration;
  if (!slotDuration) {
    labelInterval = this.ensureLabelInterval();
    for (j = 0, len = STOCK_SUB_DURATIONS.length; j < len; j++) {
      input = STOCK_SUB_DURATIONS[j];
      trySlotDuration = moment.duration(input);
      slotsPerLabel = divideDurationByDuration(labelInterval, trySlotDuration);
      if (isInt(slotsPerLabel) && slotsPerLabel > 1 && slotsPerLabel <= MAX_AUTO_SLOTS_PER_LABEL) {
        slotDuration = trySlotDuration;
        break;
      }
    }
    if (slotDuration && this.duration) {
      slotCnt = divideDurationByDuration(this.duration, slotDuration);
      if (slotCnt > MAX_AUTO_CELLS) {
        slotDuration = null;
      }
    }
    if (!slotDuration) {
      slotDuration = labelInterval;
    }
    this.slotDuration = slotDuration;
  }
  return slotDuration;
};

TimelineGrid.prototype.computeHeaderFormats = function() {
  var format0, format1, format2, gridDuration, labelInterval, unit, view, weekNumbersVisible;
  view = this.view;
  gridDuration = this.duration;
  labelInterval = this.labelInterval;
  unit = computeIntervalUnit(labelInterval);
  weekNumbersVisible = this.opt('weekNumbers');
  format0 = format1 = format2 = null;
  if (unit === 'week' && !weekNumbersVisible) {
    unit = 'day';
  }
  switch (unit) {
    case 'year':
      format0 = 'YYYY';
      break;
    case 'month':
      if (gridDuration.asYears() > 1) {
        format0 = 'YYYY';
      }
      format1 = 'MMM';
      break;
    case 'week':
      if (gridDuration.asYears() > 1) {
        format0 = 'YYYY';
      }
      format1 = this.opt('shortWeekFormat');
      break;
    case 'day':
      if (gridDuration.asYears() > 1) {
        format0 = this.opt('monthYearFormat');
      } else if (gridDuration.asMonths() > 1) {
        format0 = 'MMMM';
      }
      if (weekNumbersVisible) {
        format1 = this.opt('weekFormat');
      }
      format2 = 'dd D';
      break;
    case 'hour':
      if (weekNumbersVisible) {
        format0 = this.opt('weekFormat');
      }
      if (gridDuration.asDays() > 1) {
        format1 = this.opt('dayOfMonthFormat');
      }
      format2 = this.opt('smallTimeFormat');
      break;
    case 'minute':
      if (labelInterval.asMinutes() / 60 >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = this.opt('hourFormat');
        format1 = '[:]mm';
      } else {
        format0 = this.opt('mediumTimeFormat');
      }
      break;
    case 'second':
      if (labelInterval.asSeconds() / 60 >= MAX_AUTO_SLOTS_PER_LABEL) {
        format0 = 'LT';
        format1 = '[:]ss';
      } else {
        format0 = 'LTS';
      }
      break;
    case 'millisecond':
      format0 = 'LTS';
      format1 = '[.]SSS';
  }
  return [].concat(format0 || [], format1 || [], format2 || []);
};

FC.views.timeline = {
  "class": TimelineView,
  defaults: {
    eventResizableFromStart: true
  }
};

FC.views.timelineDay = {
  type: 'timeline',
  duration: {
    days: 1
  }
};

FC.views.timelineWeek = {
  type: 'timeline',
  duration: {
    weeks: 1
  }
};

FC.views.timelineMonth = {
  type: 'timeline',
  duration: {
    months: 1
  }
};

FC.views.timelineYear = {
  type: 'timeline',
  duration: {
    years: 1
  }
};

ResourceTimelineView = (function(superClass) {
  extend(ResourceTimelineView, superClass);

  function ResourceTimelineView() {
    return ResourceTimelineView.__super__.constructor.apply(this, arguments);
  }

  ResourceTimelineView.mixin(ResourceViewMixin);

  ResourceTimelineView.prototype.canRenderSpecificResources = true;

  ResourceTimelineView.prototype.resourceGrid = null;

  ResourceTimelineView.prototype.tbodyHash = null;

  ResourceTimelineView.prototype.joiner = null;

  ResourceTimelineView.prototype.dividerEls = null;

  ResourceTimelineView.prototype.superHeaderText = null;

  ResourceTimelineView.prototype.isVGrouping = null;

  ResourceTimelineView.prototype.isHGrouping = null;

  ResourceTimelineView.prototype.groupSpecs = null;

  ResourceTimelineView.prototype.colSpecs = null;

  ResourceTimelineView.prototype.orderSpecs = null;

  ResourceTimelineView.prototype.rowHierarchy = null;

  ResourceTimelineView.prototype.resourceRowHash = null;

  ResourceTimelineView.prototype.nestingCnt = 0;

  ResourceTimelineView.prototype.isNesting = null;

  ResourceTimelineView.prototype.dividerWidth = null;

  ResourceTimelineView.prototype.initialize = function() {
    ResourceTimelineView.__super__.initialize.apply(this, arguments);
    this.processResourceOptions();
    this.resourceGrid = new Spreadsheet(this);
    this.rowHierarchy = new RowParent(this);
    return this.resourceRowHash = {};
  };

  ResourceTimelineView.prototype.instantiateGrid = function() {
    return new ResourceTimelineGrid(this);
  };

  ResourceTimelineView.prototype.processResourceOptions = function() {
    var allColSpecs, allOrderSpecs, colSpec, defaultLabelText, groupColSpecs, groupSpec, groupSpecs, hGroupField, isGroup, isHGrouping, isVGrouping, j, k, l, labelText, len, len1, len2, orderSpec, plainColSpecs, plainOrderSpecs, superHeaderText;
    allColSpecs = this.opt('resourceColumns') || [];
    labelText = this.opt('resourceLabelText');
    defaultLabelText = 'Resources';
    superHeaderText = null;
    if (!allColSpecs.length) {
      allColSpecs.push({
        labelText: labelText || defaultLabelText,
        text: this.getResourceTextFunc()
      });
    } else {
      superHeaderText = labelText;
    }
    plainColSpecs = [];
    groupColSpecs = [];
    groupSpecs = [];
    isVGrouping = false;
    isHGrouping = false;
    for (j = 0, len = allColSpecs.length; j < len; j++) {
      colSpec = allColSpecs[j];
      if (colSpec.group) {
        groupColSpecs.push(colSpec);
      } else {
        plainColSpecs.push(colSpec);
      }
    }
    plainColSpecs[0].isMain = true;
    if (groupColSpecs.length) {
      groupSpecs = groupColSpecs;
      isVGrouping = true;
    } else {
      hGroupField = this.opt('resourceGroupField');
      if (hGroupField) {
        isHGrouping = true;
        groupSpecs.push({
          field: hGroupField,
          text: this.opt('resourceGroupText'),
          render: this.opt('resourceGroupRender')
        });
      }
    }
    allOrderSpecs = parseFieldSpecs(this.opt('resourceOrder'));
    plainOrderSpecs = [];
    for (k = 0, len1 = allOrderSpecs.length; k < len1; k++) {
      orderSpec = allOrderSpecs[k];
      isGroup = false;
      for (l = 0, len2 = groupSpecs.length; l < len2; l++) {
        groupSpec = groupSpecs[l];
        if (groupSpec.field === orderSpec.field) {
          groupSpec.order = orderSpec.order;
          isGroup = true;
          break;
        }
      }
      if (!isGroup) {
        plainOrderSpecs.push(orderSpec);
      }
    }
    this.superHeaderText = superHeaderText;
    this.isVGrouping = isVGrouping;
    this.isHGrouping = isHGrouping;
    this.groupSpecs = groupSpecs;
    this.colSpecs = groupColSpecs.concat(plainColSpecs);
    return this.orderSpecs = plainOrderSpecs;
  };

  ResourceTimelineView.prototype.renderSkeleton = function() {
    ResourceTimelineView.__super__.renderSkeleton.apply(this, arguments);
    this.renderResourceGridSkeleton();
    this.tbodyHash = {
      spreadsheet: this.resourceGrid.tbodyEl,
      event: this.timeGrid.tbodyEl
    };
    this.joiner = new ScrollJoiner('vertical', [this.resourceGrid.bodyScroller, this.timeGrid.bodyScroller]);
    return this.initDividerMoving();
  };

  ResourceTimelineView.prototype.renderSkeletonHtml = function() {
    return '<table> <thead class="fc-head"> <tr> <td class="fc-resource-area ' + this.widgetHeaderClass + '"></td> <td class="fc-divider fc-col-resizer ' + this.widgetHeaderClass + '"></td> <td class="fc-time-area ' + this.widgetHeaderClass + '"></td> </tr> </thead> <tbody class="fc-body"> <tr> <td class="fc-resource-area ' + this.widgetContentClass + '"></td> <td class="fc-divider fc-col-resizer ' + this.widgetHeaderClass + '"></td> <td class="fc-time-area ' + this.widgetContentClass + '"></td> </tr> </tbody> </table>';
  };

  ResourceTimelineView.prototype.renderResourceGridSkeleton = function() {
    this.resourceGrid.el = this.el.find('tbody .fc-resource-area');
    this.resourceGrid.headEl = this.el.find('thead .fc-resource-area');
    return this.resourceGrid.renderSkeleton();
  };

  ResourceTimelineView.prototype.initDividerMoving = function() {
    var ref;
    this.dividerEls = this.el.find('.fc-divider');
    this.dividerWidth = (ref = this.opt('resourceAreaWidth')) != null ? ref : this.resourceGrid.tableWidth;
    if (this.dividerWidth != null) {
      this.positionDivider(this.dividerWidth);
    }
    return this.dividerEls.on('mousedown', (function(_this) {
      return function(ev) {
        return _this.dividerMousedown(ev);
      };
    })(this));
  };

  ResourceTimelineView.prototype.dividerMousedown = function(ev) {
    var dragListener, isRTL, maxWidth, minWidth, origWidth;
    isRTL = this.opt('isRTL');
    minWidth = 30;
    maxWidth = this.el.width() - 30;
    origWidth = this.getNaturalDividerWidth();
    dragListener = new DragListener({
      dragStart: (function(_this) {
        return function() {
          return _this.dividerEls.addClass('fc-active');
        };
      })(this),
      drag: (function(_this) {
        return function(dx, dy) {
          var width;
          if (isRTL) {
            width = origWidth - dx;
          } else {
            width = origWidth + dx;
          }
          width = Math.max(width, minWidth);
          width = Math.min(width, maxWidth);
          _this.dividerWidth = width;
          _this.positionDivider(width);
          return _this.updateWidth();
        };
      })(this),
      dragEnd: (function(_this) {
        return function() {
          return _this.dividerEls.removeClass('fc-active');
        };
      })(this)
    });
    return dragListener.startInteraction(ev);
  };

  ResourceTimelineView.prototype.getNaturalDividerWidth = function() {
    return this.el.find('.fc-resource-area').width();
  };

  ResourceTimelineView.prototype.positionDivider = function(w) {
    return this.el.find('.fc-resource-area').width(w);
  };

  ResourceTimelineView.prototype.renderEvents = function(events) {
    this.timeGrid.renderEvents(events);
    this.syncRowHeights();
    return this.updateWidth();
  };

  ResourceTimelineView.prototype.unrenderEvents = function() {
    this.timeGrid.unrenderEvents();
    this.syncRowHeights();
    return this.updateWidth();
  };

  ResourceTimelineView.prototype.updateWidth = function() {
    ResourceTimelineView.__super__.updateWidth.apply(this, arguments);
    this.resourceGrid.updateWidth();
    this.joiner.update();
    if (this.cellFollower) {
      return this.cellFollower.update();
    }
  };

  ResourceTimelineView.prototype.updateHeight = function(isResize) {
    ResourceTimelineView.__super__.updateHeight.apply(this, arguments);
    if (isResize) {
      return this.syncRowHeights();
    }
  };

  ResourceTimelineView.prototype.setHeight = function(totalHeight, isAuto) {
    var bodyHeight, headHeight;
    headHeight = this.syncHeadHeights();
    if (isAuto) {
      bodyHeight = 'auto';
    } else {
      bodyHeight = totalHeight - headHeight - this.queryMiscHeight();
    }
    this.timeGrid.bodyScroller.setHeight(bodyHeight);
    return this.resourceGrid.bodyScroller.setHeight(bodyHeight);
  };

  ResourceTimelineView.prototype.queryMiscHeight = function() {
    return this.el.outerHeight() - Math.max(this.resourceGrid.headScroller.el.outerHeight(), this.timeGrid.headScroller.el.outerHeight()) - Math.max(this.resourceGrid.bodyScroller.el.outerHeight(), this.timeGrid.bodyScroller.el.outerHeight());
  };

  ResourceTimelineView.prototype.syncHeadHeights = function() {
    var headHeight;
    this.resourceGrid.headHeight('auto');
    this.timeGrid.headHeight('auto');
    headHeight = Math.max(this.resourceGrid.headHeight(), this.timeGrid.headHeight());
    this.resourceGrid.headHeight(headHeight);
    this.timeGrid.headHeight(headHeight);
    return headHeight;
  };

  ResourceTimelineView.prototype.renderResources = function(resources) {
    var j, len, resource;
    this.batchRows();
    for (j = 0, len = resources.length; j < len; j++) {
      resource = resources[j];
      this.insertResource(resource);
    }
    this.rowHierarchy.show();
    this.unbatchRows();
    return this.reinitializeCellFollowers();
  };

  ResourceTimelineView.prototype.unrenderResources = function() {
    this.batchRows();
    this.rowHierarchy.removeChildren();
    this.unbatchRows();
    return this.reinitializeCellFollowers();
  };


  /*
  	TODO: the scenario where there were previously unassociated events that are now
  	 attached to this resource. should render those events immediately.
  
  	Responsible for rendering the new resource
   */

  ResourceTimelineView.prototype.renderResource = function(resource) {
    this.insertResource(resource);
    return this.reinitializeCellFollowers();
  };

  ResourceTimelineView.prototype.unrenderResource = function(resource) {
    var row;
    row = this.getResourceRow(resource.id);
    if (row) {
      this.batchRows();
      row.remove();
      this.unbatchRows();
      return this.reinitializeCellFollowers();
    }
  };

  ResourceTimelineView.prototype.cellFollower = null;

  ResourceTimelineView.prototype.reinitializeCellFollowers = function() {
    var cellContent, j, len, nodes, ref, row;
    if (this.cellFollower) {
      this.cellFollower.clearSprites();
    }
    this.cellFollower = new ScrollFollower(this.resourceGrid.bodyScroller, true);
    this.cellFollower.isHFollowing = false;
    this.cellFollower.isVFollowing = true;
    nodes = [];
    ref = this.rowHierarchy.getNodes();
    for (j = 0, len = ref.length; j < len; j++) {
      row = ref[j];
      if (row instanceof VRowGroup) {
        if (row.groupTd) {
          cellContent = row.groupTd.find('.fc-cell-content');
          if (cellContent.length) {
            nodes.push(cellContent[0]);
          }
        }
      }
    }
    return this.cellFollower.setSprites($(nodes));
  };

  ResourceTimelineView.prototype.insertResource = function(resource, parentResourceRow) {
    var childResource, j, len, parentId, ref, results, row;
    row = new ResourceRow(this, resource);
    if (parentResourceRow == null) {
      parentId = resource.parentId;
      if (parentId) {
        parentResourceRow = this.getResourceRow(parentId);
      }
    }
    if (parentResourceRow) {
      this.insertRowAsChild(row, parentResourceRow);
    } else {
      this.insertRow(row);
    }
    ref = resource.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      childResource = ref[j];
      results.push(this.insertResource(childResource, row));
    }
    return results;
  };

  ResourceTimelineView.prototype.insertRow = function(row, parent, groupSpecs) {
    var group;
    if (parent == null) {
      parent = this.rowHierarchy;
    }
    if (groupSpecs == null) {
      groupSpecs = this.groupSpecs;
    }
    if (groupSpecs.length) {
      group = this.ensureResourceGroup(row, parent, groupSpecs[0]);
      if (group instanceof HRowGroup) {
        return this.insertRowAsChild(row, group);
      } else {
        return this.insertRow(row, group, groupSpecs.slice(1));
      }
    } else {
      return this.insertRowAsChild(row, parent);
    }
  };

  ResourceTimelineView.prototype.insertRowAsChild = function(row, parent) {
    return parent.addChild(row, this.computeChildRowPosition(row, parent));
  };

  ResourceTimelineView.prototype.computeChildRowPosition = function(child, parent) {
    var cmp, i, j, len, ref, sibling;
    if (this.orderSpecs.length) {
      ref = parent.children;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        sibling = ref[i];
        cmp = this.compareResources(sibling.resource || {}, child.resource || {});
        if (cmp > 0) {
          return i;
        }
      }
    }
    return null;
  };

  ResourceTimelineView.prototype.compareResources = function(a, b) {
    return compareByFieldSpecs(a, b, this.orderSpecs);
  };

  ResourceTimelineView.prototype.ensureResourceGroup = function(row, parent, spec) {
    var cmp, group, groupValue, i, j, k, len, len1, ref, ref1, testGroup;
    groupValue = (row.resource || {})[spec.field];
    group = null;
    if (spec.order) {
      ref = parent.children;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        testGroup = ref[i];
        cmp = flexibleCompare(testGroup.groupValue, groupValue) * spec.order;
        if (cmp === 0) {
          group = testGroup;
          break;
        } else if (cmp > 0) {
          break;
        }
      }
    } else {
      ref1 = parent.children;
      for (i = k = 0, len1 = ref1.length; k < len1; i = ++k) {
        testGroup = ref1[i];
        if (testGroup.groupValue === groupValue) {
          group = testGroup;
          break;
        }
      }
    }
    if (!group) {
      if (this.isVGrouping) {
        group = new VRowGroup(this, spec, groupValue);
      } else {
        group = new HRowGroup(this, spec, groupValue);
      }
      parent.addChild(group, i);
    }
    return group;
  };

  ResourceTimelineView.prototype.pairSegsWithRows = function(segs) {
    var j, len, pair, pairs, pairsById, resourceId, rowObj, seg;
    pairs = [];
    pairsById = {};
    for (j = 0, len = segs.length; j < len; j++) {
      seg = segs[j];
      resourceId = seg.resourceId;
      if (resourceId) {
        rowObj = this.getResourceRow(resourceId);
        if (rowObj) {
          pair = pairsById[resourceId];
          if (!pair) {
            pair = [rowObj, []];
            pairs.push(pair);
            pairsById[resourceId] = pair;
          }
          pair[1].push(seg);
        }
      }
    }
    return pairs;
  };

  ResourceTimelineView.prototype.rowAdded = function(row) {
    var isNesting, wasNesting;
    if (row instanceof ResourceRow) {
      this.resourceRowHash[row.resource.id] = row;
      this.timeGrid.assignRowBusinessHourSegs(row);
    }
    wasNesting = this.isNesting;
    isNesting = Boolean(this.nestingCnt += row.depth ? 1 : 0);
    if (wasNesting !== isNesting) {
      this.el.toggleClass('fc-nested', isNesting);
      this.el.toggleClass('fc-flat', !isNesting);
    }
    return this.isNesting = isNesting;
  };

  ResourceTimelineView.prototype.rowRemoved = function(row) {
    var isNesting, wasNesting;
    if (row instanceof ResourceRow) {
      delete this.resourceRowHash[row.resource.id];
      this.timeGrid.destroyRowBusinessHourSegs(row);
    }
    wasNesting = this.isNesting;
    isNesting = Boolean(this.nestingCnt -= row.depth ? 1 : 0);
    if (wasNesting !== isNesting) {
      this.el.toggleClass('fc-nested', isNesting);
      this.el.toggleClass('fc-flat', !isNesting);
    }
    return this.isNesting = isNesting;
  };

  ResourceTimelineView.prototype.batchRowDepth = 0;

  ResourceTimelineView.prototype.shownRowBatch = null;

  ResourceTimelineView.prototype.hiddenRowBatch = null;

  ResourceTimelineView.prototype.batchRows = function() {
    if (!(this.batchRowDepth++)) {
      this.shownRowBatch = [];
      return this.hiddenRowBatch = [];
    }
  };

  ResourceTimelineView.prototype.unbatchRows = function() {
    if (!(--this.batchRowDepth)) {
      if (this.hiddenRowBatch.length) {
        this.rowsHidden(this.hiddenRowBatch);
      }
      if (this.shownRowBatch.length) {
        this.rowsShown(this.shownRowBatch);
      }
      this.hiddenRowBatch = null;
      return this.shownRowBatch = null;
    }
  };

  ResourceTimelineView.prototype.rowShown = function(row) {
    if (this.shownRowBatch) {
      return this.shownRowBatch.push(row);
    } else {
      return this.rowsShown([row]);
    }
  };

  ResourceTimelineView.prototype.rowHidden = function(row) {
    if (this.hiddenRowBatch) {
      return this.hiddenRowBatch.push(row);
    } else {
      return this.rowsHidden([row]);
    }
  };

  ResourceTimelineView.prototype.rowsShown = function(rows) {
    this.syncRowHeights(rows);
    return this.updateWidth();
  };

  ResourceTimelineView.prototype.rowsHidden = function(rows) {
    return this.updateWidth();
  };

  ResourceTimelineView.prototype.syncRowHeights = function(visibleRows, safe) {
    var h, h1, h2, i, innerHeights, j, k, len, len1, row;
    if (safe == null) {
      safe = false;
    }
    if (visibleRows == null) {
      visibleRows = this.getVisibleRows();
    }
    for (j = 0, len = visibleRows.length; j < len; j++) {
      row = visibleRows[j];
      row.setTrInnerHeight('');
    }
    innerHeights = (function() {
      var k, len1, results;
      results = [];
      for (k = 0, len1 = visibleRows.length; k < len1; k++) {
        row = visibleRows[k];
        h = row.getMaxTrInnerHeight();
        if (safe) {
          h += h % 2;
        }
        results.push(h);
      }
      return results;
    })();
    for (i = k = 0, len1 = visibleRows.length; k < len1; i = ++k) {
      row = visibleRows[i];
      row.setTrInnerHeight(innerHeights[i]);
    }
    if (!safe) {
      h1 = this.resourceGrid.tbodyEl.height();
      h2 = this.timeGrid.tbodyEl.height();
      if (Math.abs(h1 - h2) > 1) {
        return this.syncRowHeights(visibleRows, true);
      }
    }
  };

  ResourceTimelineView.prototype.getVisibleRows = function() {
    var j, len, ref, results, row;
    ref = this.rowHierarchy.getRows();
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      row = ref[j];
      if (row.isShown) {
        results.push(row);
      }
    }
    return results;
  };

  ResourceTimelineView.prototype.getEventRows = function() {
    var j, len, ref, results, row;
    ref = this.rowHierarchy.getRows();
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      row = ref[j];
      if (row instanceof EventRow) {
        results.push(row);
      }
    }
    return results;
  };

  ResourceTimelineView.prototype.getResourceRow = function(resourceId) {
    return this.resourceRowHash[resourceId];
  };

  ResourceTimelineView.prototype.queryScroll = function() {
    var el, elBottom, j, len, ref, rowObj, scroll, scrollerTop;
    scroll = ResourceTimelineView.__super__.queryScroll.apply(this, arguments);
    scrollerTop = this.timeGrid.bodyScroller.scrollEl.offset().top;
    ref = this.getVisibleRows();
    for (j = 0, len = ref.length; j < len; j++) {
      rowObj = ref[j];
      if (rowObj.resource) {
        el = rowObj.getTr('event');
        elBottom = el.offset().top + el.outerHeight();
        if (elBottom > scrollerTop) {
          scroll.resourceId = rowObj.resource.id;
          scroll.bottom = elBottom - scrollerTop;
          break;
        }
      }
    }
    return scroll;
  };

  ResourceTimelineView.prototype.setScroll = function(scroll) {
    var el, elBottom, innerTop, row;
    if (scroll.resourceId) {
      row = this.getResourceRow(scroll.resourceId);
      if (row) {
        el = row.getTr('event');
        if (el) {
          innerTop = this.timeGrid.bodyScroller.canvas.el.offset().top;
          elBottom = el.offset().top + el.outerHeight();
          scroll.top = elBottom - scroll.bottom - innerTop;
        }
      }
    }
    ResourceTimelineView.__super__.setScroll.call(this, scroll);
    return this.resourceGrid.bodyScroller.setScrollTop(scroll.top);
  };

  ResourceTimelineView.prototype.scrollToResource = function(resource) {
    var el, innerTop, row, scrollTop;
    row = this.getResourceRow(resource.id);
    if (row) {
      el = row.getTr('event');
      if (el) {
        innerTop = this.timeGrid.bodyScroller.canvas.el.offset().top;
        scrollTop = el.offset().top - innerTop;
        this.timeGrid.bodyScroller.setScrollTop(scrollTop);
        return this.resourceGrid.bodyScroller.setScrollTop(scrollTop);
      }
    }
  };

  return ResourceTimelineView;

})(TimelineView);

ResourceTimelineGrid = (function(superClass) {
  extend(ResourceTimelineGrid, superClass);

  function ResourceTimelineGrid() {
    return ResourceTimelineGrid.__super__.constructor.apply(this, arguments);
  }

  ResourceTimelineGrid.mixin(ResourceGridMixin);

  ResourceTimelineGrid.prototype.eventRows = null;

  ResourceTimelineGrid.prototype.shownEventRows = null;

  ResourceTimelineGrid.prototype.tbodyEl = null;

  ResourceTimelineGrid.prototype.rowCoordCache = null;

  ResourceTimelineGrid.prototype.spanToSegs = function(span) {
    var calendar, j, len, resourceId, seg, segs;
    segs = ResourceTimelineGrid.__super__.spanToSegs.apply(this, arguments);
    calendar = this.view.calendar;
    resourceId = span.resourceId;
    if (resourceId) {
      for (j = 0, len = segs.length; j < len; j++) {
        seg = segs[j];
        seg.resource = calendar.getResourceById(resourceId);
        seg.resourceId = resourceId;
      }
    }
    return segs;
  };

  ResourceTimelineGrid.prototype.prepareHits = function() {
    var row, trArray;
    ResourceTimelineGrid.__super__.prepareHits.apply(this, arguments);
    this.eventRows = this.view.getEventRows();
    this.shownEventRows = (function() {
      var j, len, ref, results;
      ref = this.eventRows;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        row = ref[j];
        if (row.isShown) {
          results.push(row);
        }
      }
      return results;
    }).call(this);
    trArray = (function() {
      var j, len, ref, results;
      ref = this.shownEventRows;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        row = ref[j];
        results.push(row.getTr('event')[0]);
      }
      return results;
    }).call(this);
    this.rowCoordCache = new CoordCache({
      els: trArray,
      isVertical: true
    });
    return this.rowCoordCache.build();
  };

  ResourceTimelineGrid.prototype.releaseHits = function() {
    ResourceTimelineGrid.__super__.releaseHits.apply(this, arguments);
    this.eventRows = null;
    this.shownEventRows = null;
    return this.rowCoordCache.clear();
  };

  ResourceTimelineGrid.prototype.queryHit = function(leftOffset, topOffset) {
    var rowIndex, simpleHit;
    simpleHit = ResourceTimelineGrid.__super__.queryHit.apply(this, arguments);
    if (simpleHit) {
      rowIndex = this.rowCoordCache.getVerticalIndex(topOffset);
      if (rowIndex != null) {
        return {
          resourceId: this.shownEventRows[rowIndex].resource.id,
          snap: simpleHit.snap,
          component: this,
          left: simpleHit.left,
          right: simpleHit.right,
          top: this.rowCoordCache.getTopOffset(rowIndex),
          bottom: this.rowCoordCache.getBottomOffset(rowIndex)
        };
      }
    }
  };

  ResourceTimelineGrid.prototype.getHitSpan = function(hit) {
    var span;
    span = this.getSnapRange(hit.snap);
    span.resourceId = hit.resourceId;
    return span;
  };

  ResourceTimelineGrid.prototype.getHitEl = function(hit) {
    return this.getSnapEl(hit.snap);
  };

  ResourceTimelineGrid.prototype.renderSkeleton = function() {
    var rowContainerEl;
    ResourceTimelineGrid.__super__.renderSkeleton.apply(this, arguments);
    this.segContainerEl.remove();
    this.segContainerEl = null;
    rowContainerEl = $('<div class="fc-rows"><table><tbody/></table></div>').appendTo(this.bodyScroller.canvas.contentEl);
    return this.tbodyEl = rowContainerEl.find('tbody');
  };

  ResourceTimelineGrid.prototype.renderFgSegs = function(segs) {
    var containerObj, containerSegs, j, len, pair, pairs, visiblePairs;
    segs = this.renderFgSegEls(segs);
    pairs = this.view.pairSegsWithRows(segs);
    visiblePairs = [];
    for (j = 0, len = pairs.length; j < len; j++) {
      pair = pairs[j];
      containerObj = pair[0], containerSegs = pair[1];
      containerObj.fgSegs = containerSegs;
      if (containerObj.isShown) {
        containerObj.isSegsRendered = true;
        visiblePairs.push(pair);
      }
    }
    this.renderFgSegsInContainers(visiblePairs);
    this.updateSegFollowers(segs);
    return segs;
  };

  ResourceTimelineGrid.prototype.unrenderFgSegs = function() {
    var eventRow, eventRows, j, len;
    this.clearSegFollowers();
    eventRows = this.view.getEventRows();
    for (j = 0, len = eventRows.length; j < len; j++) {
      eventRow = eventRows[j];
      eventRow.fgSegs = null;
      eventRow.isSegsRendered = false;
    }
    return this.unrenderFgContainers(eventRows);
  };

  ResourceTimelineGrid.prototype.rowCntWithCustomBusinessHours = 0;

  ResourceTimelineGrid.prototype.renderBusinessHours = function() {
    if (this.rowCntWithCustomBusinessHours) {
      return this.ensureIndividualBusinessHours();
    } else {
      return ResourceTimelineGrid.__super__.renderBusinessHours.apply(this, arguments);
    }
  };

  ResourceTimelineGrid.prototype.unrenderBusinessHours = function() {
    if (this.rowCntWithCustomBusinessHours) {
      return this.clearIndividualBusinessHours();
    } else {
      return ResourceTimelineGrid.__super__.unrenderBusinessHours.apply(this, arguments);
    }
  };


  /*
  	Ensures that all rows have their individual business hours DISPLAYED.
   */

  ResourceTimelineGrid.prototype.ensureIndividualBusinessHours = function() {
    var j, len, ref, results, row;
    ref = this.view.getEventRows();
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      row = ref[j];
      if (this.view.isDateSet && !row.businessHourSegs) {
        this.populateRowBusinessHoursSegs(row);
      }
      if (row.isShown) {
        results.push(row.ensureBusinessHourSegsRendered());
      } else {
        results.push(void 0);
      }
    }
    return results;
  };


  /*
  	Ensures that all rows have their individual business hours CLEARED.
   */

  ResourceTimelineGrid.prototype.clearIndividualBusinessHours = function() {
    var j, len, ref, results, row;
    ref = this.view.getEventRows();
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      row = ref[j];
      results.push(row.clearBusinessHourSegs());
    }
    return results;
  };


  /*
  	Called when a row has been added to the tree data structure, but before it's rendered.
  	Computes and assigns business hour data *if necessary*. To be rendered soon after.
   */

  ResourceTimelineGrid.prototype.assignRowBusinessHourSegs = function(row) {
    if (row.resource.businessHours) {
      if (!this.rowCntWithCustomBusinessHours) {
        TimelineGrid.prototype.unrenderBusinessHours.call(this);
        this.ensureIndividualBusinessHours();
      }
      this.rowCntWithCustomBusinessHours += 1;
    }
    if (this.view.isDateSet && this.rowCntWithCustomBusinessHours) {
      return this.populateRowBusinessHoursSegs(row);
    }
  };


  /*
  	Called when a row has been removed from the tree data structure.
  	Unrenders the row's segs and, if necessary, forces businessHours back to generic rendering.
   */

  ResourceTimelineGrid.prototype.destroyRowBusinessHourSegs = function(row) {
    row.clearBusinessHourSegs();
    if (row.resource.businessHours) {
      this.rowCntWithCustomBusinessHours -= 1;
      if (!this.rowCntWithCustomBusinessHours) {
        this.clearIndividualBusinessHours();
        return TimelineGrid.prototype.renderBusinessHours.call(this);
      }
    }
  };


  /*
  	Compute and assign to row.businessHourSegs unconditionally
   */

  ResourceTimelineGrid.prototype.populateRowBusinessHoursSegs = function(row) {
    var businessHourSegs, businessHours, businessHoursEvents;
    businessHours = row.resource.businessHours || this.view.opt('businessHours');
    businessHoursEvents = this.view.calendar.computeBusinessHourEvents(!this.isTimeScale, businessHours);
    businessHourSegs = this.eventsToSegs(businessHoursEvents);
    businessHourSegs = this.renderFillSegEls('businessHours', businessHourSegs);
    row.businessHourSegs = businessHourSegs;
  };

  ResourceTimelineGrid.prototype.renderFill = function(type, segs, className) {
    var j, k, len, len1, nonResourceSegs, pair, pairs, resourceSegs, rowObj, rowSegs, seg, visiblePairs;
    segs = this.renderFillSegEls(type, segs);
    resourceSegs = [];
    nonResourceSegs = [];
    for (j = 0, len = segs.length; j < len; j++) {
      seg = segs[j];
      if (seg.resourceId) {
        resourceSegs.push(seg);
      } else {
        nonResourceSegs.push(seg);
      }
    }
    pairs = this.view.pairSegsWithRows(resourceSegs);
    visiblePairs = [];
    for (k = 0, len1 = pairs.length; k < len1; k++) {
      pair = pairs[k];
      rowObj = pair[0], rowSegs = pair[1];
      if (type === 'bgEvent') {
        rowObj.bgSegs = rowSegs;
      }
      if (rowObj.isShown) {
        visiblePairs.push(pair);
      }
    }
    if (nonResourceSegs.length) {
      visiblePairs.unshift([this, nonResourceSegs]);
    }
    this.renderFillInContainers(type, visiblePairs, className);
    return segs;
  };

  ResourceTimelineGrid.prototype.renderHelper = function(event, sourceSeg) {
    var pairs, segs;
    segs = this.eventToSegs(event);
    segs = this.renderFgSegEls(segs);
    pairs = this.view.pairSegsWithRows(segs);
    return this.renderHelperSegsInContainers(pairs, sourceSeg);
  };

  return ResourceTimelineGrid;

})(TimelineGrid);

COL_MIN_WIDTH = 30;

Spreadsheet = (function() {
  Spreadsheet.prototype.view = null;

  Spreadsheet.prototype.headEl = null;

  Spreadsheet.prototype.el = null;

  Spreadsheet.prototype.tbodyEl = null;

  Spreadsheet.prototype.headScroller = null;

  Spreadsheet.prototype.bodyScroller = null;

  Spreadsheet.prototype.joiner = null;

  function Spreadsheet(view1) {
    var colSpec;
    this.view = view1;
    this.isRTL = this.view.opt('isRTL');
    this.givenColWidths = this.colWidths = (function() {
      var j, len, ref, results;
      ref = this.view.colSpecs;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        colSpec = ref[j];
        results.push(colSpec.width);
      }
      return results;
    }).call(this);
  }

  Spreadsheet.prototype.colGroupHtml = '';

  Spreadsheet.prototype.headTable = null;

  Spreadsheet.prototype.headColEls = null;

  Spreadsheet.prototype.headCellEls = null;

  Spreadsheet.prototype.bodyColEls = null;

  Spreadsheet.prototype.bodyTable = null;

  Spreadsheet.prototype.renderSkeleton = function() {
    this.headScroller = new ClippedScroller({
      overflowX: 'clipped-scroll',
      overflowY: 'hidden'
    });
    this.headScroller.canvas = new ScrollerCanvas();
    this.headScroller.render();
    this.headScroller.canvas.contentEl.html(this.renderHeadHtml());
    this.headEl.append(this.headScroller.el);
    this.bodyScroller = new ClippedScroller({
      overflowY: 'clipped-scroll'
    });
    this.bodyScroller.canvas = new ScrollerCanvas();
    this.bodyScroller.render();
    this.bodyScroller.canvas.contentEl.html('<div class="fc-rows"><table>' + this.colGroupHtml + '<tbody/></table></div>');
    this.tbodyEl = this.bodyScroller.canvas.contentEl.find('tbody');
    this.el.append(this.bodyScroller.el);
    this.joiner = new ScrollJoiner('horizontal', [this.headScroller, this.bodyScroller]);
    this.headTable = this.headEl.find('table');
    this.headColEls = this.headEl.find('col');
    this.headCellEls = this.headScroller.canvas.contentEl.find('tr:last-child th');
    this.bodyColEls = this.el.find('col');
    this.bodyTable = this.el.find('table');
    this.colMinWidths = this.computeColMinWidths();
    this.applyColWidths();
    return this.initColResizing();
  };

  Spreadsheet.prototype.renderHeadHtml = function() {
    var colGroupHtml, colSpecs, html, i, isLast, isMainCol, j, k, len, len1, o;
    colSpecs = this.view.colSpecs;
    html = '<table>';
    colGroupHtml = '<colgroup>';
    for (j = 0, len = colSpecs.length; j < len; j++) {
      o = colSpecs[j];
      if (o.isMain) {
        colGroupHtml += '<col class="fc-main-col"/>';
      } else {
        colGroupHtml += '<col/>';
      }
    }
    colGroupHtml += '</colgroup>';
    this.colGroupHtml = colGroupHtml;
    html += colGroupHtml;
    html += '<tbody>';
    if (this.view.superHeaderText) {
      html += '<tr class="fc-super">' + '<th class="' + this.view.widgetHeaderClass + '" colspan="' + colSpecs.length + '">' + '<div class="fc-cell-content">' + '<span class="fc-cell-text">' + htmlEscape(this.view.superHeaderText) + '</span>' + '</div>' + '</th>' + '</tr>';
    }
    html += '<tr>';
    isMainCol = true;
    for (i = k = 0, len1 = colSpecs.length; k < len1; i = ++k) {
      o = colSpecs[i];
      isLast = i === colSpecs.length - 1;
      html += '<th class="' + this.view.widgetHeaderClass + '">' + '<div>' + '<div class="fc-cell-content">' + (o.isMain ? '<span class="fc-expander-space">' + '<span class="fc-icon"></span>' + '</span>' : '') + '<span class="fc-cell-text">' + htmlEscape(o.labelText || '') + '</span>' + '</div>' + (!isLast ? '<div class="fc-col-resizer"></div>' : '') + '</div>' + '</th>';
    }
    html += '</tr>';
    html += '</tbody></table>';
    return html;
  };

  Spreadsheet.prototype.givenColWidths = null;

  Spreadsheet.prototype.colWidths = null;

  Spreadsheet.prototype.colMinWidths = null;

  Spreadsheet.prototype.tableWidth = null;

  Spreadsheet.prototype.tableMinWidth = null;

  Spreadsheet.prototype.initColResizing = function() {
    return this.headEl.find('th .fc-col-resizer').each((function(_this) {
      return function(i, resizerEl) {
        resizerEl = $(resizerEl);
        return resizerEl.on('mousedown', function(ev) {
          return _this.colResizeMousedown(i, ev, resizerEl);
        });
      };
    })(this));
  };

  Spreadsheet.prototype.colResizeMousedown = function(i, ev, resizerEl) {
    var colWidths, dragListener, minWidth, origColWidth;
    colWidths = this.colWidths = this.queryColWidths();
    colWidths.pop();
    colWidths.push(null);
    origColWidth = colWidths[i];
    minWidth = Math.min(this.colMinWidths[i], COL_MIN_WIDTH);
    dragListener = new DragListener({
      dragStart: (function(_this) {
        return function() {
          return resizerEl.addClass('fc-active');
        };
      })(this),
      drag: (function(_this) {
        return function(dx, dy) {
          var width;
          width = origColWidth + (_this.isRTL ? -dx : dx);
          width = Math.max(width, minWidth);
          colWidths[i] = width;
          return _this.applyColWidths();
        };
      })(this),
      dragEnd: (function(_this) {
        return function() {
          return resizerEl.removeClass('fc-active');
        };
      })(this)
    });
    return dragListener.startInteraction(ev);
  };

  Spreadsheet.prototype.applyColWidths = function() {
    var allNumbers, anyPercentages, colMinWidths, colWidth, colWidths, cssWidth, cssWidths, defaultCssWidth, i, j, k, l, len, len1, len2, tableMinWidth, total;
    colMinWidths = this.colMinWidths;
    colWidths = this.colWidths;
    allNumbers = true;
    anyPercentages = false;
    total = 0;
    for (j = 0, len = colWidths.length; j < len; j++) {
      colWidth = colWidths[j];
      if (typeof colWidth === 'number') {
        total += colWidth;
      } else {
        allNumbers = false;
        if (colWidth) {
          anyPercentages = true;
        }
      }
    }
    defaultCssWidth = anyPercentages && !this.view.isHGrouping ? 'auto' : '';
    cssWidths = (function() {
      var k, len1, results;
      results = [];
      for (i = k = 0, len1 = colWidths.length; k < len1; i = ++k) {
        colWidth = colWidths[i];
        results.push(colWidth != null ? colWidth : defaultCssWidth);
      }
      return results;
    })();
    tableMinWidth = 0;
    for (i = k = 0, len1 = cssWidths.length; k < len1; i = ++k) {
      cssWidth = cssWidths[i];
      tableMinWidth += typeof cssWidth === 'number' ? cssWidth : colMinWidths[i];
    }
    for (i = l = 0, len2 = cssWidths.length; l < len2; i = ++l) {
      cssWidth = cssWidths[i];
      this.headColEls.eq(i).width(cssWidth);
      this.bodyColEls.eq(i).width(cssWidth);
    }
    this.headScroller.canvas.setMinWidth(tableMinWidth);
    this.bodyScroller.canvas.setMinWidth(tableMinWidth);
    this.tableMinWidth = tableMinWidth;
    return this.tableWidth = allNumbers ? total : void 0;
  };

  Spreadsheet.prototype.computeColMinWidths = function() {
    var i, j, len, ref, results, width;
    ref = this.givenColWidths;
    results = [];
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      width = ref[i];
      if (typeof width === 'number') {
        results.push(width);
      } else {
        results.push(parseInt(this.headColEls.eq(i).css('min-width')) || COL_MIN_WIDTH);
      }
    }
    return results;
  };

  Spreadsheet.prototype.queryColWidths = function() {
    var j, len, node, ref, results;
    ref = this.headCellEls;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      node = ref[j];
      results.push($(node).outerWidth());
    }
    return results;
  };

  Spreadsheet.prototype.updateWidth = function() {
    this.headScroller.updateSize();
    this.bodyScroller.updateSize();
    this.joiner.update();
    if (this.follower) {
      return this.follower.update();
    }
  };

  Spreadsheet.prototype.headHeight = function() {
    var table;
    table = this.headScroller.canvas.contentEl.find('table');
    return table.height.apply(table, arguments);
  };

  return Spreadsheet;

})();


/*
An abstract node in a row-hierarchy tree.
May be a self-contained single row, a row with subrows,
OR a grouping of rows without its own distinct row.
 */

RowParent = (function() {
  RowParent.prototype.view = null;

  RowParent.prototype.parent = null;

  RowParent.prototype.prevSibling = null;

  RowParent.prototype.children = null;

  RowParent.prototype.depth = 0;

  RowParent.prototype.hasOwnRow = false;

  RowParent.prototype.trHash = null;

  RowParent.prototype.trs = null;

  RowParent.prototype.isRendered = false;

  RowParent.prototype.isExpanded = true;

  RowParent.prototype.isShown = false;

  function RowParent(view1) {
    this.view = view1;
    this.children = [];
    this.trHash = {};
    this.trs = $();
  }


  /*
  	Adds the given node as a child.
  	Will be inserted at the `index`. If not given, will be appended to the end.
   */

  RowParent.prototype.addChild = function(child, index) {
    var children, j, len, node, ref;
    child.remove();
    children = this.children;
    if (index != null) {
      children.splice(index, 0, child);
    } else {
      index = children.length;
      children.push(child);
    }
    child.prevSibling = index > 0 ? children[index - 1] : null;
    if (index < children.length - 1) {
      children[index + 1].prevSibling = child;
    }
    child.parent = this;
    child.depth = this.depth + (this.hasOwnRow ? 1 : 0);
    ref = child.getNodes();
    for (j = 0, len = ref.length; j < len; j++) {
      node = ref[j];
      node.added();
    }
    if (this.isShown && this.isExpanded) {
      return child.show();
    }
  };


  /*
  	Removes the given child from the node. Assumes it is a direct child.
  	If not a direct child, returns false and nothing happens.
  	Unrenders the child and triggers handlers.
   */

  RowParent.prototype.removeChild = function(child) {
    var children, i, isFound, j, k, len, len1, ref, row, testChild;
    children = this.children;
    isFound = false;
    for (i = j = 0, len = children.length; j < len; i = ++j) {
      testChild = children[i];
      if (testChild === child) {
        isFound = true;
        break;
      }
    }
    if (!isFound) {
      return false;
    } else {
      if (i < children.length - 1) {
        children[i + 1].prevSibling = child.prevSibling;
      }
      children.splice(i, 1);
      child.recursivelyUnrender();
      ref = child.getNodes();
      for (k = 0, len1 = ref.length; k < len1; k++) {
        row = ref[k];
        row.removed();
      }
      child.parent = null;
      child.prevSibling = null;
      return child;
    }
  };


  /*
  	Removes all of the node's children from the hierarchy. Unrenders them and triggers callbacks.
  	NOTE: batchRows/unbatchRows should probably be called before this happens :(
   */

  RowParent.prototype.removeChildren = function() {
    var child, j, k, len, len1, ref, ref1;
    ref = this.children;
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      child.recursivelyUnrender();
    }
    ref1 = this.getDescendants();
    for (k = 0, len1 = ref1.length; k < len1; k++) {
      child = ref1[k];
      child.removed();
    }
    return this.children = [];
  };


  /*
  	Removes this node from its parent
   */

  RowParent.prototype.remove = function() {
    if (this.parent) {
      return this.parent.removeChild(this);
    }
  };


  /*
  	Gets the last direct child node
   */

  RowParent.prototype.getLastChild = function() {
    var children;
    children = this.children;
    return children[children.length - 1];
  };


  /*
  	Walks backward in the hierarchy to find the previous row leaf node.
  	When looking at the hierarchy in a flat linear fashion, this is the revealed row just before the current.
   */

  RowParent.prototype.getPrevRow = function() {
    var lastChild, node;
    node = this;
    while (node) {
      if (node.prevSibling) {
        node = node.prevSibling;
        while ((lastChild = node.getLastChild())) {
          node = lastChild;
        }
      } else {
        node = node.parent;
      }
      if (node && node.hasOwnRow && node.isShown) {
        return node;
      }
    }
    return null;
  };


  /*
  	Returns the first node in the subtree that has a revealed row
   */

  RowParent.prototype.getLeadingRow = function() {
    if (this.hasOwnRow) {
      return this;
    } else if (this.isExpanded && this.children.length) {
      return this.children[0].getLeadingRow();
    }
  };


  /*
  	Generates a flat array containing all the row-nodes of the subtree. Descendants + self
   */

  RowParent.prototype.getRows = function(batchArray) {
    var child, j, len, ref;
    if (batchArray == null) {
      batchArray = [];
    }
    if (this.hasOwnRow) {
      batchArray.push(this);
    }
    ref = this.children;
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      child.getRows(batchArray);
    }
    return batchArray;
  };


  /*
  	Generates a flat array containing all the nodes (row/non-row) of the subtree. Descendants + self
   */

  RowParent.prototype.getNodes = function(batchArray) {
    var child, j, len, ref;
    if (batchArray == null) {
      batchArray = [];
    }
    batchArray.push(this);
    ref = this.children;
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      child.getNodes(batchArray);
    }
    return batchArray;
  };


  /*
  	Generates a flat array containing all the descendant nodes the current node
   */

  RowParent.prototype.getDescendants = function() {
    var batchArray, child, j, len, ref;
    batchArray = [];
    ref = this.children;
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      child.getNodes(batchArray);
    }
    return batchArray;
  };


  /*
  	Builds and populates the TRs for each row type. Inserts them into the DOM.
  	Does this only for this single row. Not recursive. If not a row (hasOwnRow=false), does not render anything.
  	PRECONDITION: assumes the parent has already been rendered.
   */

  RowParent.prototype.render = function() {
    var prevRow, ref, renderMethodName, tbody, tr, trNodes, type;
    this.trHash = {};
    trNodes = [];
    if (this.hasOwnRow) {
      prevRow = this.getPrevRow();
      ref = this.view.tbodyHash;
      for (type in ref) {
        tbody = ref[type];
        tr = $('<tr/>');
        this.trHash[type] = tr;
        trNodes.push(tr[0]);
        renderMethodName = 'render' + capitaliseFirstLetter(type) + 'Content';
        if (this[renderMethodName]) {
          this[renderMethodName](tr);
        }
        if (prevRow) {
          prevRow.trHash[type].after(tr);
        } else {
          tbody.prepend(tr);
        }
      }
    }
    this.trs = $(trNodes).on('click', '.fc-expander', proxy(this, 'toggleExpanded'));
    return this.isRendered = true;
  };


  /*
  	Unpopulates and removes all of this row's TRs from the DOM. Only for this single row. Not recursive.
  	Will trigger "hidden".
   */

  RowParent.prototype.unrender = function() {
    var ref, tr, type, unrenderMethodName;
    if (this.isRendered) {
      ref = this.trHash;
      for (type in ref) {
        tr = ref[type];
        unrenderMethodName = 'unrender' + capitaliseFirstLetter(type) + 'Content';
        if (this[unrenderMethodName]) {
          this[unrenderMethodName](tr);
        }
      }
      this.trHash = {};
      this.trs.remove();
      this.trs = $();
      this.isRendered = false;
      this.isShown = false;
      return this.hidden();
    }
  };


  /*
  	Like unrender(), but does it for this row AND all descendants.
  	NOTE: batchRows/unbatchRows should probably be called before this happens :(
   */

  RowParent.prototype.recursivelyUnrender = function() {
    var child, j, len, ref, results;
    this.unrender();
    ref = this.children;
    results = [];
    for (j = 0, len = ref.length; j < len; j++) {
      child = ref[j];
      results.push(child.recursivelyUnrender());
    }
    return results;
  };


  /*
  	A simple getter for retrieving a TR jQuery object of a certain row type
   */

  RowParent.prototype.getTr = function(type) {
    return this.trHash[type];
  };


  /*
  	Renders this row if not already rendered, making sure it is visible.
  	Also renders descendants of this subtree, based on whether they are expanded or not.
  	NOTE: If called externally, batchRows/unbatchRows should probably be called before this happens :(
   */

  RowParent.prototype.show = function() {
    var child, j, len, ref, results;
    if (!this.isShown) {
      if (!this.isRendered) {
        this.render();
      } else {
        this.trs.css('display', '');
      }
      if (this.ensureSegsRendered) {
        this.ensureSegsRendered();
      }
      if (this.isExpanded) {
        this.indicateExpanded();
      } else {
        this.indicateCollapsed();
      }
      this.isShown = true;
      this.shown();
      if (this.isExpanded) {
        ref = this.children;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          child = ref[j];
          results.push(child.show());
        }
        return results;
      }
    }
  };


  /*
  	Temporarily hides this node's TRs (if applicable) as well as all nodes in the subtree
   */

  RowParent.prototype.hide = function() {
    var child, j, len, ref, results;
    if (this.isShown) {
      if (this.isRendered) {
        this.trs.hide();
      }
      this.isShown = false;
      this.hidden();
      if (this.isExpanded) {
        ref = this.children;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          child = ref[j];
          results.push(child.hide());
        }
        return results;
      }
    }
  };


  /*
  	Reveals this node's children if they have not already been revealed. Changes any expander icon.
   */

  RowParent.prototype.expand = function() {
    var child, j, len, ref;
    if (!this.isExpanded) {
      this.isExpanded = true;
      this.indicateExpanded();
      this.view.batchRows();
      ref = this.children;
      for (j = 0, len = ref.length; j < len; j++) {
        child = ref[j];
        child.show();
      }
      this.view.unbatchRows();
      return this.animateExpand();
    }
  };


  /*
  	Hides this node's children if they are not already hidden. Changes any expander icon.
   */

  RowParent.prototype.collapse = function() {
    var child, j, len, ref;
    if (this.isExpanded) {
      this.isExpanded = false;
      this.indicateCollapsed();
      this.view.batchRows();
      ref = this.children;
      for (j = 0, len = ref.length; j < len; j++) {
        child = ref[j];
        child.hide();
      }
      return this.view.unbatchRows();
    }
  };


  /*
  	Switches between expanded/collapsed states
   */

  RowParent.prototype.toggleExpanded = function() {
    if (this.isExpanded) {
      return this.collapse();
    } else {
      return this.expand();
    }
  };


  /*
  	Changes the expander icon to the "expanded" state
   */

  RowParent.prototype.indicateExpanded = function() {
    return this.trs.find('.fc-expander .fc-icon').removeClass(this.getCollapsedIcon()).addClass(this.getExpandedIcon());
  };


  /*
  	Changes the expander icon to the "collapsed" state
   */

  RowParent.prototype.indicateCollapsed = function() {
    return this.trs.find('.fc-expander .fc-icon').removeClass(this.getExpandedIcon()).addClass(this.getCollapsedIcon());
  };


  /*
   */

  RowParent.prototype.enableExpanding = function() {
    return this.trs.find('.fc-expander-space').addClass('fc-expander');
  };


  /*
   */

  RowParent.prototype.disableExpanding = function() {
    return this.trs.find('.fc-expander-space').removeClass('fc-expander').find('.fc-icon').removeClass(this.getExpandedIcon()).removeClass(this.getCollapsedIcon());
  };

  RowParent.prototype.getExpandedIcon = function() {
    return 'fc-icon-down-triangle';
  };

  RowParent.prototype.getCollapsedIcon = function() {
    var dir;
    dir = this.view.isRTL ? 'left' : 'right';
    return 'fc-icon-' + dir + '-triangle';
  };


  /*
  	Causes a slide-down CSS transition to demonstrate that the expand has happened
   */

  RowParent.prototype.animateExpand = function() {
    var ref, ref1, trs;
    trs = (ref = this.children[0]) != null ? (ref1 = ref.getLeadingRow()) != null ? ref1.trs : void 0 : void 0;
    if (trs) {
      trs.addClass('fc-collapsed');
      setTimeout(function() {
        trs.addClass('fc-transitioning');
        return trs.removeClass('fc-collapsed');
      });
      return trs.one('webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend', function() {
        return trs.removeClass('fc-transitioning');
      });
    }
  };


  /*
  	Find each TRs "inner div" (div within first cell). This div controls each TRs height.
  	Returns the max pixel height.
   */

  RowParent.prototype.getMaxTrInnerHeight = function() {
    var max;
    max = 0;
    $.each(this.trHash, (function(_this) {
      return function(type, tr) {
        var innerEl;
        innerEl = getOwnCells(tr).find('> div:not(.fc-cell-content):first');
        return max = Math.max(innerEl.height(), max);
      };
    })(this));
    return max;
  };


  /*
  	Find each TRs "inner div" and sets all of their heights to the same value.
   */

  RowParent.prototype.setTrInnerHeight = function(height) {
    return $.each(this.trHash, (function(_this) {
      return function(type, tr) {
        return getOwnCells(tr).find('> div:not(.fc-cell-content):first').height(height);
      };
    })(this));
  };


  /*
  	Triggered when the current node has been shown (either freshly rendered or re-shown)
  	when it had previously been unrendered or hidden. `shown` does not bubble up the hierarchy.
   */

  RowParent.prototype.shown = function() {
    if (this.hasOwnRow) {
      return this.rowShown(this);
    }
  };


  /*
  	Triggered when the current node has been hidden (either temporarily or permanently)
  	when it had previously been shown. `hidden` does not bubble up the hierarchy.
   */

  RowParent.prototype.hidden = function() {
    if (this.hasOwnRow) {
      return this.rowHidden(this);
    }
  };


  /*
  	Just like `shown`, but only triggered for nodes that are actual rows. Bubbles up the hierarchy.
   */

  RowParent.prototype.rowShown = function(row) {
    return (this.parent || this.view).rowShown(row);
  };


  /*
  	Just like `hidden`, but only triggered for nodes that are actual rows. Bubbles up the hierarchy.
   */

  RowParent.prototype.rowHidden = function(row) {
    return (this.parent || this.view).rowHidden(row);
  };


  /*
  	Triggered when the current node has been added to the hierarchy. `added` does not bubble up.
   */

  RowParent.prototype.added = function() {
    if (this.hasOwnRow) {
      return this.rowAdded(this);
    }
  };


  /*
  	Triggered when the current node has been removed from the hierarchy. `removed` does not bubble up.
   */

  RowParent.prototype.removed = function() {
    if (this.hasOwnRow) {
      return this.rowRemoved(this);
    }
  };


  /*
  	Just like `added`, but only triggered for nodes that are actual rows. Bubbles up the hierarchy.
   */

  RowParent.prototype.rowAdded = function(row) {
    return (this.parent || this.view).rowAdded(row);
  };


  /*
  	Just like `removed`, but only triggered for nodes that are actual rows. Bubbles up the hierarchy.
   */

  RowParent.prototype.rowRemoved = function(row) {
    return (this.parent || this.view).rowRemoved(row);
  };

  return RowParent;

})();


/*
An abstract node in a row-hierarchy tree that contains other nodes.
Will have some sort of rendered label indicating the grouping,
up to the subclass for determining what to do with it.
 */

RowGroup = (function(superClass) {
  extend(RowGroup, superClass);

  RowGroup.prototype.groupSpec = null;

  RowGroup.prototype.groupValue = null;

  function RowGroup(view, groupSpec1, groupValue1) {
    this.groupSpec = groupSpec1;
    this.groupValue = groupValue1;
    RowGroup.__super__.constructor.apply(this, arguments);
  }


  /*
  	Called when this row (if it renders a row) or a subrow is removed
   */

  RowGroup.prototype.rowRemoved = function(row) {
    RowGroup.__super__.rowRemoved.apply(this, arguments);
    if (row !== this && !this.children.length) {
      return this.remove();
    }
  };


  /*
  	Renders the content wrapper element that will be inserted into this row's TD cell
   */

  RowGroup.prototype.renderGroupContentEl = function() {
    var contentEl, filter;
    contentEl = $('<div class="fc-cell-content" />').append(this.renderGroupTextEl());
    filter = this.groupSpec.render;
    if (typeof filter === 'function') {
      contentEl = filter(contentEl, this.groupValue) || contentEl;
    }
    return contentEl;
  };


  /*
  	Renders the text span element that will be inserted into this row's TD cell.
  	Goes within the content element.
   */

  RowGroup.prototype.renderGroupTextEl = function() {
    var filter, text;
    text = this.groupValue || '';
    filter = this.groupSpec.text;
    if (typeof filter === 'function') {
      text = filter(text) || text;
    }
    return $('<span class="fc-cell-text" />').text(text);
  };

  return RowGroup;

})(RowParent);


/*
A row grouping that renders as a single solid row that spans width-wise (like a horizontal rule)
 */

HRowGroup = (function(superClass) {
  extend(HRowGroup, superClass);

  function HRowGroup() {
    return HRowGroup.__super__.constructor.apply(this, arguments);
  }

  HRowGroup.prototype.hasOwnRow = true;


  /*
  	Renders this row's TR for the "spreadsheet" quadrant, the area with info about each resource
   */

  HRowGroup.prototype.renderSpreadsheetContent = function(tr) {
    var contentEl;
    contentEl = this.renderGroupContentEl();
    contentEl.prepend('<span class="fc-expander">' + '<span class="fc-icon"></span>' + '</span>');
    return $('<td class="fc-divider" />').attr('colspan', this.view.colSpecs.length).append($('<div/>').append(contentEl)).appendTo(tr);
  };


  /*
  	Renders this row's TR for the quadrant that contains a resource's events
   */

  HRowGroup.prototype.renderEventContent = function(tr) {
    return tr.append('<td class="fc-divider"> <div/> </td>');
  };

  return HRowGroup;

})(RowGroup);


/*
A row grouping that renders as a tall multi-cell vertical span in the "spreadsheet" area
 */

VRowGroup = (function(superClass) {
  extend(VRowGroup, superClass);

  function VRowGroup() {
    return VRowGroup.__super__.constructor.apply(this, arguments);
  }

  VRowGroup.prototype.rowspan = 0;

  VRowGroup.prototype.leadingTr = null;

  VRowGroup.prototype.groupTd = null;


  /*
  	Called when a row somewhere within the grouping is shown
   */

  VRowGroup.prototype.rowShown = function(row) {
    this.rowspan += 1;
    this.renderRowspan();
    return VRowGroup.__super__.rowShown.apply(this, arguments);
  };


  /*
  	Called when a row somewhere within the grouping is hidden
   */

  VRowGroup.prototype.rowHidden = function(row) {
    this.rowspan -= 1;
    this.renderRowspan();
    return VRowGroup.__super__.rowHidden.apply(this, arguments);
  };


  /*
  	Makes sure the groupTd has the correct rowspan / place in the DOM.
  	PRECONDITION: in the case of multiple group nesting, a child's renderRowspan()
  	will be called before the parent's renderRowspan().
   */

  VRowGroup.prototype.renderRowspan = function() {
    var leadingTr;
    if (this.rowspan) {
      if (!this.groupTd) {
        this.groupTd = $('<td class="' + this.view.widgetContentClass + '"/>').append(this.renderGroupContentEl());
      }
      this.groupTd.attr('rowspan', this.rowspan);
      leadingTr = this.getLeadingRow().getTr('spreadsheet');
      if (leadingTr !== this.leadingTr) {
        if (leadingTr) {
          leadingTr.prepend(this.groupTd);
        }
        return this.leadingTr = leadingTr;
      }
    } else {
      if (this.groupTd) {
        this.groupTd.remove();
        this.groupTd = null;
      }
      return this.leadingTr = null;
    }
  };

  return VRowGroup;

})(RowGroup);

EventRow = (function(superClass) {
  extend(EventRow, superClass);

  function EventRow() {
    return EventRow.__super__.constructor.apply(this, arguments);
  }

  EventRow.prototype.hasOwnRow = true;

  EventRow.prototype.segContainerEl = null;

  EventRow.prototype.segContainerHeight = null;

  EventRow.prototype.innerEl = null;

  EventRow.prototype.bgSegContainerEl = null;

  EventRow.prototype.isSegsRendered = false;

  EventRow.prototype.isBusinessHourSegsRendered = false;

  EventRow.prototype.businessHourSegs = null;

  EventRow.prototype.bgSegs = null;

  EventRow.prototype.fgSegs = null;

  EventRow.prototype.renderEventContent = function(tr) {
    tr.html('<td class="' + this.view.widgetContentClass + '"> <div> <div class="fc-event-container" /> </div> </td>');
    this.segContainerEl = tr.find('.fc-event-container');
    this.innerEl = this.bgSegContainerEl = tr.find('td > div');
    return this.ensureSegsRendered();
  };

  EventRow.prototype.ensureSegsRendered = function() {
    if (!this.isSegsRendered) {
      this.ensureBusinessHourSegsRendered();
      if (this.bgSegs) {
        this.view.timeGrid.renderFillInContainer('bgEvent', this, this.bgSegs);
      }
      if (this.fgSegs) {
        this.view.timeGrid.renderFgSegsInContainers([[this, this.fgSegs]]);
      }
      return this.isSegsRendered = true;
    }
  };

  EventRow.prototype.ensureBusinessHourSegsRendered = function() {
    if (this.businessHourSegs && !this.isBusinessHourSegsRendered) {
      this.view.timeGrid.renderFillInContainer('businessHours', this, this.businessHourSegs, 'bgevent');
      return this.isBusinessHourSegsRendered = true;
    }
  };

  EventRow.prototype.unrenderEventContent = function() {
    this.clearBusinessHourSegs();
    this.bgSegs = null;
    this.fgSegs = null;
    return this.isSegsRendered = false;
  };

  EventRow.prototype.clearBusinessHourSegs = function() {
    var j, len, ref, seg;
    if (this.businessHourSegs) {
      ref = this.businessHourSegs;
      for (j = 0, len = ref.length; j < len; j++) {
        seg = ref[j];
        if (seg.el) {
          seg.el.remove();
        }
      }
      this.businessHourSegs = null;
    }
    return this.isBusinessHourSegsRendered = false;
  };

  return EventRow;

})(RowParent);


/*
A row that renders information about a particular resource, as well as it events (handled by superclass)
 */

ResourceRow = (function(superClass) {
  extend(ResourceRow, superClass);

  ResourceRow.prototype.resource = null;

  function ResourceRow(view, resource1) {
    this.resource = resource1;
    ResourceRow.__super__.constructor.apply(this, arguments);
  }


  /*
  	Called when a row in the tree has been added
   */

  ResourceRow.prototype.rowAdded = function(row) {
    ResourceRow.__super__.rowAdded.apply(this, arguments);
    if (row !== this && this.isRendered) {
      if (this.children.length === 1) {
        this.enableExpanding();
        if (this.isExpanded) {
          return this.indicateExpanded();
        } else {
          return this.indicateCollapsed();
        }
      }
    }
  };


  /*
  	Called when a row in the tree has been removed
   */

  ResourceRow.prototype.rowRemoved = function(row) {
    ResourceRow.__super__.rowRemoved.apply(this, arguments);
    if (row !== this && this.isRendered) {
      if (!this.children.length) {
        return this.disableExpanding();
      }
    }
  };

  ResourceRow.prototype.render = function() {
    ResourceRow.__super__.render.apply(this, arguments);
    if (this.children.length > 0) {
      this.enableExpanding();
    } else {
      this.disableExpanding();
    }
    return this.view.publiclyTrigger('resourceRender', this.resource, this.resource, this.getTr('spreadsheet').find('> td'), this.getTr('event').find('> td'));
  };

  ResourceRow.prototype.renderEventContent = function(tr) {
    ResourceRow.__super__.renderEventContent.apply(this, arguments);
    return tr.attr('data-resource-id', this.resource.id);
  };


  /*
  	Populates the TR with cells containing data about the resource
   */

  ResourceRow.prototype.renderSpreadsheetContent = function(tr) {
    var colSpec, contentEl, input, j, len, ref, resource, td, text;
    resource = this.resource;
    ref = this.view.colSpecs;
    for (j = 0, len = ref.length; j < len; j++) {
      colSpec = ref[j];
      if (colSpec.group) {
        continue;
      }
      input = colSpec.field ? resource[colSpec.field] || null : resource;
      text = typeof colSpec.text === 'function' ? colSpec.text(resource, input) : input;
      contentEl = $('<div class="fc-cell-content">' + (colSpec.isMain ? this.renderGutterHtml() : '') + '<span class="fc-cell-text">' + (text ? htmlEscape(text) : '&nbsp;') + '</span>' + '</div>');
      if (typeof colSpec.render === 'function') {
        contentEl = colSpec.render(resource, contentEl, input) || contentEl;
      }
      td = $('<td class="' + this.view.widgetContentClass + '"/>').append(contentEl);
      if (colSpec.isMain) {
        td.wrapInner('<div/>');
      }
      tr.append(td);
    }
    return tr.attr('data-resource-id', resource.id);
  };


  /*
  	Renders the HTML responsible for the subrow expander area,
  	as well as the space before it (used to align expanders of similar depths)
   */

  ResourceRow.prototype.renderGutterHtml = function() {
    var html, i, j, ref;
    html = '';
    for (i = j = 0, ref = this.depth; j < ref; i = j += 1) {
      html += '<span class="fc-icon"/>';
    }
    html += '<span class="fc-expander-space">' + '<span class="fc-icon"></span>' + '</span>';
    return html;
  };

  return ResourceRow;

})(EventRow);

FC.views.timeline.resourceClass = ResourceTimelineView;

ResourceAgendaView = (function(superClass) {
  extend(ResourceAgendaView, superClass);

  function ResourceAgendaView() {
    return ResourceAgendaView.__super__.constructor.apply(this, arguments);
  }

  ResourceAgendaView.mixin(VertResourceViewMixin);

  ResourceAgendaView.prototype.timeGridClass = ResourceTimeGrid;

  ResourceAgendaView.prototype.dayGridClass = ResourceDayGrid;

  ResourceAgendaView.prototype.renderHead = function() {
    ResourceAgendaView.__super__.renderHead.apply(this, arguments);
    return this.timeGrid.processHeadResourceEls(this.headContainerEl);
  };

  ResourceAgendaView.prototype.setResourcesOnGrids = function(resources) {
    this.timeGrid.setResources(resources);
    if (this.dayGrid) {
      return this.dayGrid.setResources(resources);
    }
  };

  ResourceAgendaView.prototype.unsetResourcesOnGrids = function() {
    this.timeGrid.unsetResources();
    if (this.dayGrid) {
      return this.dayGrid.unsetResources();
    }
  };

  return ResourceAgendaView;

})(FC.AgendaView);

FC.views.agenda.queryResourceClass = function(viewSpec) {
  var ref;
  if ((ref = viewSpec.options.groupByResource || viewSpec.options.groupByDateAndResource) != null ? ref : viewSpec.duration.as('days') === 1) {
    return ResourceAgendaView;
  }
};

ResourceBasicView = (function(superClass) {
  extend(ResourceBasicView, superClass);

  function ResourceBasicView() {
    return ResourceBasicView.__super__.constructor.apply(this, arguments);
  }

  ResourceBasicView.mixin(VertResourceViewMixin);

  ResourceBasicView.prototype.dayGridClass = ResourceDayGrid;

  ResourceBasicView.prototype.renderHead = function() {
    ResourceBasicView.__super__.renderHead.apply(this, arguments);
    return this.dayGrid.processHeadResourceEls(this.headContainerEl);
  };

  ResourceBasicView.prototype.setResourcesOnGrids = function(resources) {
    return this.dayGrid.setResources(resources);
  };

  ResourceBasicView.prototype.unsetResourcesOnGrids = function() {
    return this.dayGrid.unsetResources();
  };

  return ResourceBasicView;

})(FC.BasicView);

ResourceMonthView = (function(superClass) {
  extend(ResourceMonthView, superClass);

  function ResourceMonthView() {
    return ResourceMonthView.__super__.constructor.apply(this, arguments);
  }

  ResourceMonthView.mixin(VertResourceViewMixin);

  ResourceMonthView.prototype.dayGridClass = ResourceDayGrid;

  ResourceMonthView.prototype.renderHead = function() {
    ResourceMonthView.__super__.renderHead.apply(this, arguments);
    return this.dayGrid.processHeadResourceEls(this.headContainerEl);
  };

  ResourceMonthView.prototype.setResourcesOnGrids = function(resources) {
    return this.dayGrid.setResources(resources);
  };

  ResourceMonthView.prototype.unsetResourcesOnGrids = function() {
    return this.dayGrid.unsetResources();
  };

  return ResourceMonthView;

})(FC.MonthView);

FC.views.basic.queryResourceClass = function(viewSpec) {
  var ref;
  if ((ref = viewSpec.options.groupByResource || viewSpec.options.groupByDateAndResource) != null ? ref : viewSpec.duration.as('days') === 1) {
    return ResourceBasicView;
  }
};

FC.views.month.queryResourceClass = function(viewSpec) {
  if (viewSpec.options.groupByResource || viewSpec.options.groupByDateAndResource) {
    return ResourceMonthView;
  }
};

RELEASE_DATE = '2017-02-14';

UPGRADE_WINDOW = {
  years: 1,
  weeks: 1
};

LICENSE_INFO_URL = 'http://fullcalendar.io/scheduler/license/';

PRESET_LICENSE_KEYS = ['GPL-My-Project-Is-Open-Source', 'CC-Attribution-NonCommercial-NoDerivatives'];

processLicenseKey = function(key, containerEl) {
  if (!isImmuneUrl(window.location.href) && !isValidKey(key)) {
    if (!detectWarningInContainer(containerEl)) {
      return renderingWarningInContainer('Please use a valid license key. <a href="' + LICENSE_INFO_URL + '">More Info</a>', containerEl);
    }
  }
};


/*
This decryption is not meant to be bulletproof. Just a way to remind about an upgrade.
 */

isValidKey = function(key) {
  var minPurchaseDate, parts, purchaseDate, releaseDate;
  if ($.inArray(key, PRESET_LICENSE_KEYS) !== -1) {
    return true;
  }
  parts = (key || '').match(/^(\d+)\-fcs\-(\d+)$/);
  if (parts && parts[1].length === 10) {
    purchaseDate = moment.utc(parseInt(parts[2]) * 1000);
    releaseDate = moment.utc(FC.mockSchedulerReleaseDate || RELEASE_DATE);
    if (releaseDate.isValid()) {
      minPurchaseDate = releaseDate.clone().subtract(UPGRADE_WINDOW);
      if (purchaseDate.isAfter(minPurchaseDate)) {
        return true;
      }
    }
  }
  return false;
};

isImmuneUrl = function(url) {
  return Boolean(url.match(/\w+\:\/\/fullcalendar\.io\/|\/demos\/[\w-]+\.html$/));
};

renderingWarningInContainer = function(messageHtml, containerEl) {
  return containerEl.append($('<div class="fc-license-message" />').html(messageHtml));
};

detectWarningInContainer = function(containerEl) {
  return containerEl.find('.fc-license-message').length >= 1;
};

});
