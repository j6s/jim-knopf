var Knob;
Knob = function (input, ui) {
    var container = document.createElement('div');
    container.setAttribute('tabindex', 0);
    input.parentNode.replaceChild(container, input);
    input.style.cssText = 'position: absolute; top: -10000px';
    input.setAttribute('tabindex', -1);
    container.appendChild(input);

    var settings = this.settings = this._getSettings(input);


    this.value = input.value = settings.min + settings.range / 2;
    this.input = input;
    this.min = settings.min;

    this.ui = ui;
    input.addEventListener('change', this.changed.bind(this), false);

    var events = {
        keydown: this._handleKeyEvents.bind(this),
        mousewheel: this._handleWheelEvents.bind(this),
        DOMMouseScroll: this._handleWheelEvents.bind(this),
        touchstart: this._handleMove.bind(this, 'touchmove', 'touchend'),
        mousedown: this._handleMove.bind(this, 'mousemove', 'mouseup'),
        click: this._updateWhileMoving.bind(this)
    };

    for (var event in events) {
        container.addEventListener(event, events[event], false);
    }

    container.style.cssText = 'position: absolute; width:' + settings.width + 'px;' + 'height:' + settings.height + 'px;';
    container.className = settings.class;

    ui.init(container, settings);


    this.container = container;
    this.changed(0);

};

Knob.prototype = {
    _handleKeyEvents: function (e) {
        var keycode = e.keyCode;
        if (keycode >= 37 && keycode <= 40) {
            e.preventDefault();
            var f = 1 + e.shiftKey * 9;
            this.changed({37: -1, 38: 1, 39: 1, 40: -1}[keycode] * f);
        }
    },

    _handleWheelEvents: function (e) {
        e.preventDefault();
        var deltaX = -e.detail || e.wheelDeltaX;
        var deltaY = -e.detail || e.wheelDeltaY;
        var val = deltaX > 0 || deltaY > 0 ? 1 : deltaX < 0 || deltaY < 0 ? -1 : 0;
        this.changed(val);
    },

    _handleMove: function (onMove, onEnd) {
        /*
         function getOffsetTop(element){
         if(element.parentElement){
         //if(element.offsetTop !== element.parentNode.offsetTop){
         console.log(element.offsetTop,element.getBoundingClientRect().top,element);

         return element.offsetTop + getOffsetTop(element.parentElement);
         //}
         }
         return element.offsetTop;
         }

         function getOffsetLeft(element){
         if(element.parentElement){
         return element.offsetLeft + getOffsetLeft(element.parentElement);
         }
         return element.offsetLeft;
         }
         */


        var rect = this.container.getBoundingClientRect();

        this.centerX = rect.left + this.settings.width / 2;
        this.centerY = rect.top + document.querySelector("body").scrollTop + this.settings.height / 2;
        console.log([rect.top, this.centerY]);
        var fnc = this._updateWhileMoving.bind(this);
        var body = document.body;
        body.addEventListener(onMove, fnc, false);
        body.addEventListener(onEnd, function () {
            body.removeEventListener(onMove, fnc, false);
        }, false);
    },

    _updateWhileMoving: function (event) {
        event.preventDefault();
        var e = event.changedTouches ? event.changedTouches[0] : event;
        var x = this.centerX - e.pageX;
        var y = this.centerY - e.pageY;
        var deg = Math.atan2(-y, -x) * 180 / Math.PI + 90 - this.settings.angleoffset;
        var percent;

        if (deg < 0) {
            deg += 360;
        }
        deg = deg % 360;
        if (deg <= this.settings.anglerange) {
            percent = Math.max(Math.min(1, deg / this.settings.anglerange), 0);
        } else {
            percent = +(deg - this.settings.anglerange < (360 - this.settings.anglerange) / 2);
        }
        var range = this.settings.range;
        //console.log([this.min,range,percent,this.settings]);
        var value = this.min + range * percent;

        var step = this.input.step;
        //console.log(["value",value,"step",step])
        this.value = this.input.value = Math.round(value / step) * step;
        this.ui.update(percent, this.value);

        if (typeof(this.input.onchange) == "function") {
            this.input.onchange();
        }

    },

    changed: function (direction) {
        this.input.value = this.limit(parseFloat(this.input.value) + direction * (this.input.step || 1));
        this.value = this.input.value;
        this.ui.update(this._valueToPercent(), this.value);
        if (typeof(this.input.onchange) == "function") {
            this.input.onchange();
        }
    },

    _valueToPercent: function () {
        return  this.value != null ? 100 / this.settings.range * (this.value - this.min) / 100 : this.min;
    },

    limit: function (value) {
        return Math.min(Math.max(this.settings.min, value), this.settings.max);
    },
    _getSettings: function (input) {
        var settings = {
            max: parseFloat(input.max),
            min: parseFloat(input.min),
            step: parseFloat(input.step) || 1,
            multiplier: 3,
            angleoffset: 0,
            anglerange: 360
        };
        settings.range = settings.max - settings.min;
        var data = input.dataset;
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                var value = +data[i];
                settings[i] = isNaN(value) ? data[i] : value;
            }
        }
        return settings;
    }
};


