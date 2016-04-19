
/** @preserve OverlappingMarkerSpiderfier
https://github.com/jawj/OverlappingMarkerSpiderfier
Copyright (c) 2011 - 2013 George MacKerron
Released under the MIT licence: http://opensource.org/licenses/mit-license
Note: The Google Maps API v3 must be included *before* this code
 */
var __hasProp = {}.hasOwnProperty,
  __slice = [].slice;

this['OverlappingMarkerSpiderfier'] = (function() {
  var ge, gm, lcH, lcU, mt, p, twoPi, x, _i, _len, _ref;

  p = _Class.prototype;

  _ref = [_Class, p];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    x = _ref[_i];
    x['VERSION'] = '0.3.3';
  }

  gm = google.maps;

  ge = gm.event;

  mt = gm.MapTypeId;

  twoPi = Math.PI * 2;

  p['keepSpiderfied'] = false;

  p['markersWontHide'] = false;

  p['markersWontMove'] = false;

  p['nearbyDistance'] = 20;

  p['circleSpiralSwitchover'] = 9;

  p['circleFootSeparation'] = 23;

  p['circleStartAngle'] = twoPi / 12;

  p['spiralFootSeparation'] = 26;

  p['spiralLengthStart'] = 11;

  p['spiralLengthFactor'] = 4;

  p['spiderfiedZIndex'] = 1000;

  p['usualLegZIndex'] = 10;

  p['highlightedLegZIndex'] = 20;

  p['event'] = 'click';

  p['minZoomLevel'] = false;

  p['legWeight'] = 1.5;

  p['legColors'] = {
    'usual': {},
    'highlighted': {}
  };

  lcU = p['legColors']['usual'];

  lcH = p['legColors']['highlighted'];

  lcU[mt.HYBRID] = lcU[mt.SATELLITE] = '#fff';

  lcH[mt.HYBRID] = lcH[mt.SATELLITE] = '#f00';

  lcU[mt.TERRAIN] = lcU[mt.ROADMAP] = '#444';

  lcH[mt.TERRAIN] = lcH[mt.ROADMAP] = '#f00';

  function _Class(map, opts) {
    var e, k, v, _j, _len1, _ref1;
    this.map = map;
    if (opts == null) {
      opts = {};
    }
    for (k in opts) {
      if (!__hasProp.call(opts, k)) continue;
      v = opts[k];
      this[k] = v;
    }
    this.projHelper = new this.constructor.ProjHelper(this.map);
    this.initMarkerArrays();
    this.listeners = {};
    _ref1 = ['click', 'zoom_changed', 'maptypeid_changed'];
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      e = _ref1[_j];
      ge.addListener(this.map, e, (function(_this) {
        return function() {
          return _this['unspiderfy']();
        };
      })(this));
    }
  }

  p.initMarkerArrays = function() {
    this.markers = [];
    return this.markerListenerRefs = [];
  };

  p['addMarker'] = function(marker) {
    var listenerRefs;
    if (marker['_oms'] != null) {
      return this;
    }
    marker['_oms'] = true;
    listenerRefs = [
      ge.addListener(marker, this['event'], (function(_this) {
        return function(event) {
          return _this.spiderListener(marker, event);
        };
      })(this))
    ];
    if (!this['markersWontHide']) {
      listenerRefs.push(ge.addListener(marker, 'visible_changed', (function(_this) {
        return function() {
          return _this.markerChangeListener(marker, false);
        };
      })(this)));
    }
    if (!this['markersWontMove']) {
      listenerRefs.push(ge.addListener(marker, 'position_changed', (function(_this) {
        return function() {
          return _this.markerChangeListener(marker, true);
        };
      })(this)));
    }
    this.markerListenerRefs.push(listenerRefs);
    this.markers.push(marker);
    return this;
  };

  p.markerChangeListener = function(marker, positionChanged) {
    if ((marker['_omsData'] != null) && (positionChanged || !marker.getVisible()) && !((this.spiderfying != null) || (this.unspiderfying != null))) {
      return this['unspiderfy'](positionChanged ? marker : null);
    }
  };

  p['getMarkers'] = function() {
    return this.markers.slice(0);
  };

  p['removeMarker'] = function(marker) {
    var i, listenerRef, listenerRefs, _j, _len1;
    if (marker['_omsData'] != null) {
      this['unspiderfy']();
    }
    i = this.arrIndexOf(this.markers, marker);
    if (i < 0) {
      return this;
    }
    listenerRefs = this.markerListenerRefs.splice(i, 1)[0];
    for (_j = 0, _len1 = listenerRefs.length; _j < _len1; _j++) {
      listenerRef = listenerRefs[_j];
      ge.removeListener(listenerRef);
    }
    delete marker['_oms'];
    this.markers.splice(i, 1);
    return this;
  };

  p['clearMarkers'] = function() {
    var i, listenerRef, listenerRefs, marker, _j, _k, _len1, _len2, _ref1;
    this['unspiderfy']();
    _ref1 = this.markers;
    for (i = _j = 0, _len1 = _ref1.length; _j < _len1; i = ++_j) {
      marker = _ref1[i];
      listenerRefs = this.markerListenerRefs[i];
      for (_k = 0, _len2 = listenerRefs.length; _k < _len2; _k++) {
        listenerRef = listenerRefs[_k];
        ge.removeListener(listenerRef);
      }
      delete marker['_oms'];
    }
    this.initMarkerArrays();
    return this;
  };

  p['addListener'] = function(event, func) {
    var _base;
    ((_base = this.listeners)[event] != null ? _base[event] : _base[event] = []).push(func);
    return this;
  };

  p['removeListener'] = function(event, func) {
    var i;
    i = this.arrIndexOf(this.listeners[event], func);
    if (!(i < 0)) {
      this.listeners[event].splice(i, 1);
    }
    return this;
  };

  p['clearListeners'] = function(event) {
    this.listeners[event] = [];
    return this;
  };

  p.trigger = function() {
    var args, event, func, _j, _len1, _ref1, _ref2, _results;
    event = arguments[0], args = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
    _ref2 = (_ref1 = this.listeners[event]) != null ? _ref1 : [];
    _results = [];
    for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
      func = _ref2[_j];
      _results.push(func.apply(null, args));
    }
    return _results;
  };

  p.generatePtsCircle = function(count, centerPt) {
    var angle, angleStep, circumference, i, legLength, _j, _results;
    circumference = this['circleFootSeparation'] * (2 + count);
    legLength = circumference / twoPi;
    angleStep = twoPi / count;
    _results = [];
    for (i = _j = 0; 0 <= count ? _j < count : _j > count; i = 0 <= count ? ++_j : --_j) {
      angle = this['circleStartAngle'] + i * angleStep;
      _results.push(new gm.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle)));
    }
    return _results;
  };

  p.generatePtsSpiral = function(count, centerPt) {
    var angle, i, legLength, pt, _j, _results;
    legLength = this['spiralLengthStart'];
    angle = 0;
    _results = [];
    for (i = _j = 0; 0 <= count ? _j < count : _j > count; i = 0 <= count ? ++_j : --_j) {
      angle += this['spiralFootSeparation'] / legLength + i * 0.0005;
      pt = new gm.Point(centerPt.x + legLength * Math.cos(angle), centerPt.y + legLength * Math.sin(angle));
      legLength += twoPi * this['spiralLengthFactor'] / angle;
      _results.push(pt);
    }
    return _results;
  };

  p.spiderListener = function(marker, event) {
    var $this, clear, m, mPt, markerPt, markerSpiderfied, nDist, nearbyMarkerData, nonNearbyMarkers, pxSq, _j, _len1, _ref1;
    markerSpiderfied = marker['_omsData'] != null;
    if (!(markerSpiderfied && this['keepSpiderfied'])) {
      if (this['event'] === 'mouseover') {
        $this = this;
        clear = function() {
          return $this['unspiderfy']();
        };
        window.clearTimeout(p.timeout);
        p.timeout = setTimeout(clear, 3000);
      } else {
        this['unspiderfy']();
      }
    }
    if (markerSpiderfied || this.map.getStreetView().getVisible() || this.map.getMapTypeId() === 'GoogleEarthAPI') {
      return this.trigger('click', marker, event);
    } else {
      nearbyMarkerData = [];
      nonNearbyMarkers = [];
      nDist = this['nearbyDistance'];
      pxSq = nDist * nDist;
      markerPt = this.llToPt(marker.position);
      _ref1 = this.markers;
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        m = _ref1[_j];
        if (!((m.map != null) && m.getVisible())) {
          continue;
        }
        mPt = this.llToPt(m.position);
        if (this.ptDistanceSq(mPt, markerPt) < pxSq) {
          nearbyMarkerData.push({
            marker: m,
            markerPt: mPt
          });
        } else {
          nonNearbyMarkers.push(m);
        }
      }
      if (nearbyMarkerData.length === 1) {
        return this.trigger('click', marker, event);
      } else {
        return this.spiderfy(nearbyMarkerData, nonNearbyMarkers);
      }
    }
  };

  p['markersNearMarker'] = function(marker, firstOnly) {
    var m, mPt, markerPt, markers, nDist, pxSq, _j, _len1, _ref1, _ref2, _ref3;
    if (firstOnly == null) {
      firstOnly = false;
    }
    if (this.projHelper.getProjection() == null) {
      throw "Must wait for 'idle' event on map before calling markersNearMarker";
    }
    nDist = this['nearbyDistance'];
    pxSq = nDist * nDist;
    markerPt = this.llToPt(marker.position);
    markers = [];
    _ref1 = this.markers;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      m = _ref1[_j];
      if (m === marker || (m.map == null) || !m.getVisible()) {
        continue;
      }
      mPt = this.llToPt((_ref2 = (_ref3 = m['_omsData']) != null ? _ref3.usualPosition : void 0) != null ? _ref2 : m.position);
      if (this.ptDistanceSq(mPt, markerPt) < pxSq) {
        markers.push(m);
        if (firstOnly) {
          break;
        }
      }
    }
    return markers;
  };

  p['markersNearAnyOtherMarker'] = function() {
    var i, i1, i2, m, m1, m1Data, m2, m2Data, mData, nDist, pxSq, _j, _k, _l, _len1, _len2, _len3, _ref1, _ref2, _ref3, _results;
    if (this.projHelper.getProjection() == null) {
      throw "Must wait for 'idle' event on map before calling markersNearAnyOtherMarker";
    }
    nDist = this['nearbyDistance'];
    pxSq = nDist * nDist;
    mData = (function() {
      var _j, _len1, _ref1, _ref2, _ref3, _results;
      _ref1 = this.markers;
      _results = [];
      for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
        m = _ref1[_j];
        _results.push({
          pt: this.llToPt((_ref2 = (_ref3 = m['_omsData']) != null ? _ref3.usualPosition : void 0) != null ? _ref2 : m.position),
          willSpiderfy: false
        });
      }
      return _results;
    }).call(this);
    _ref1 = this.markers;
    for (i1 = _j = 0, _len1 = _ref1.length; _j < _len1; i1 = ++_j) {
      m1 = _ref1[i1];
      if (!((m1.map != null) && m1.getVisible())) {
        continue;
      }
      m1Data = mData[i1];
      if (m1Data.willSpiderfy) {
        continue;
      }
      _ref2 = this.markers;
      for (i2 = _k = 0, _len2 = _ref2.length; _k < _len2; i2 = ++_k) {
        m2 = _ref2[i2];
        if (i2 === i1) {
          continue;
        }
        if (!((m2.map != null) && m2.getVisible())) {
          continue;
        }
        m2Data = mData[i2];
        if (i2 < i1 && !m2Data.willSpiderfy) {
          continue;
        }
        if (this.ptDistanceSq(m1Data.pt, m2Data.pt) < pxSq) {
          m1Data.willSpiderfy = m2Data.willSpiderfy = true;
          break;
        }
      }
    }
    _ref3 = this.markers;
    _results = [];
    for (i = _l = 0, _len3 = _ref3.length; _l < _len3; i = ++_l) {
      m = _ref3[i];
      if (mData[i].willSpiderfy) {
        _results.push(m);
      }
    }
    return _results;
  };

  p.makeHighlightListenerFuncs = function(marker) {
    return {
      highlight: (function(_this) {
        return function() {
          return marker['_omsData'].leg.setOptions({
            strokeColor: _this['legColors']['highlighted'][_this.map.mapTypeId],
            zIndex: _this['highlightedLegZIndex']
          });
        };
      })(this),
      unhighlight: (function(_this) {
        return function() {
          return marker['_omsData'].leg.setOptions({
            strokeColor: _this['legColors']['usual'][_this.map.mapTypeId],
            zIndex: _this['usualLegZIndex']
          });
        };
      })(this)
    };
  };

  p.spiderfy = function(markerData, nonNearbyMarkers) {
    var bodyPt, footLl, footPt, footPts, highlightListenerFuncs, leg, marker, md, nearestMarkerDatum, numFeet, spiderfiedMarkers;
    if (this['minZoomLevel'] && this.map.getZoom() < this['minZoomLevel']) {
      return false;
    }
    this.spiderfying = true;
    numFeet = markerData.length;
    bodyPt = this.ptAverage((function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = markerData.length; _j < _len1; _j++) {
        md = markerData[_j];
        _results.push(md.markerPt);
      }
      return _results;
    })());
    footPts = numFeet >= this['circleSpiralSwitchover'] ? this.generatePtsSpiral(numFeet, bodyPt).reverse() : this.generatePtsCircle(numFeet, bodyPt);
    spiderfiedMarkers = (function() {
      var _j, _len1, _results;
      _results = [];
      for (_j = 0, _len1 = footPts.length; _j < _len1; _j++) {
        footPt = footPts[_j];
        footLl = this.ptToLl(footPt);
        nearestMarkerDatum = this.minExtract(markerData, (function(_this) {
          return function(md) {
            return _this.ptDistanceSq(md.markerPt, footPt);
          };
        })(this));
        marker = nearestMarkerDatum.marker;
        leg = new gm.Polyline({
          map: this.map,
          path: [marker.position, footLl],
          strokeColor: this['legColors']['usual'][this.map.mapTypeId],
          strokeWeight: this['legWeight'],
          zIndex: this['usualLegZIndex']
        });
        marker['_omsData'] = {
          usualPosition: marker.position,
          leg: leg
        };
        if (this['legColors']['highlighted'][this.map.mapTypeId] !== this['legColors']['usual'][this.map.mapTypeId]) {
          highlightListenerFuncs = this.makeHighlightListenerFuncs(marker);
          marker['_omsData'].hightlightListeners = {
            highlight: ge.addListener(marker, 'mouseover', highlightListenerFuncs.highlight),
            unhighlight: ge.addListener(marker, 'mouseout', highlightListenerFuncs.unhighlight)
          };
        }
        marker.setPosition(footLl);
        marker.setZIndex(Math.round(this['spiderfiedZIndex'] + footPt.y));
        _results.push(marker);
      }
      return _results;
    }).call(this);
    delete this.spiderfying;
    this.spiderfied = true;
    return this.trigger('spiderfy', spiderfiedMarkers, nonNearbyMarkers);
  };

  p['unspiderfy'] = function(markerNotToMove) {
    var listeners, marker, nonNearbyMarkers, unspiderfiedMarkers, _j, _len1, _ref1;
    if (markerNotToMove == null) {
      markerNotToMove = null;
    }
    if (this.spiderfied == null) {
      return this;
    }
    this.unspiderfying = true;
    unspiderfiedMarkers = [];
    nonNearbyMarkers = [];
    _ref1 = this.markers;
    for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
      marker = _ref1[_j];
      if (marker['_omsData'] != null) {
        marker['_omsData'].leg.setMap(null);
        if (marker !== markerNotToMove) {
          marker.setPosition(marker['_omsData'].usualPosition);
        }
        marker.setZIndex(null);
        listeners = marker['_omsData'].hightlightListeners;
        if (listeners != null) {
          ge.removeListener(listeners.highlight);
          ge.removeListener(listeners.unhighlight);
        }
        delete marker['_omsData'];
        unspiderfiedMarkers.push(marker);
      } else {
        nonNearbyMarkers.push(marker);
      }
    }
    delete this.unspiderfying;
    delete this.spiderfied;
    this.trigger('unspiderfy', unspiderfiedMarkers, nonNearbyMarkers);
    return this;
  };

  p.ptDistanceSq = function(pt1, pt2) {
    var dx, dy;
    dx = pt1.x - pt2.x;
    dy = pt1.y - pt2.y;
    return dx * dx + dy * dy;
  };

  p.ptAverage = function(pts) {
    var numPts, pt, sumX, sumY, _j, _len1;
    sumX = sumY = 0;
    for (_j = 0, _len1 = pts.length; _j < _len1; _j++) {
      pt = pts[_j];
      sumX += pt.x;
      sumY += pt.y;
    }
    numPts = pts.length;
    return new gm.Point(sumX / numPts, sumY / numPts);
  };

  p.llToPt = function(ll) {
    return this.projHelper.getProjection().fromLatLngToDivPixel(ll);
  };

  p.ptToLl = function(pt) {
    return this.projHelper.getProjection().fromDivPixelToLatLng(pt);
  };

  p.minExtract = function(set, func) {
    var bestIndex, bestVal, index, item, val, _j, _len1;
    for (index = _j = 0, _len1 = set.length; _j < _len1; index = ++_j) {
      item = set[index];
      val = func(item);
      if ((typeof bestIndex === "undefined" || bestIndex === null) || val < bestVal) {
        bestVal = val;
        bestIndex = index;
      }
    }
    return set.splice(bestIndex, 1)[0];
  };

  p.arrIndexOf = function(arr, obj) {
    var i, o, _j, _len1;
    if (arr.indexOf != null) {
      return arr.indexOf(obj);
    }
    for (i = _j = 0, _len1 = arr.length; _j < _len1; i = ++_j) {
      o = arr[i];
      if (o === obj) {
        return i;
      }
    }
    return -1;
  };

  _Class.ProjHelper = function(map) {
    return this.setMap(map);
  };

  _Class.ProjHelper.prototype = new gm.OverlayView();

  _Class.ProjHelper.prototype['draw'] = function() {};

  return _Class;

})();
