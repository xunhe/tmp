let Util = {
    offset: function (el) {
        let rect = el.getBoundingClientRect()
        let doc = el.ownerDocument
        let docElem = doc.documentElement
        let win = doc.defaultView

        return {
            top: rect.top + win.pageYOffset - docElem.clientTop,
            left: rect.left + win.pageXOffset - docElem.clientLeft
        }
    },
    extend: function (o1, o2) {
        for (let k in o2) {
            o1[k] = o2[k]
        }
        return o1
    }
}

let Main = function (opts) {
    this.opts = opts
    this.rect = opts.rect
    this.dom = opts.dom
    this.imgRect = opts.image_rect || {}
    this.rawRect = opts.raw_rect || {}
    this.faceDom = opts.faceDom
    this.cbRect = {}

    this.imgWidth = this.imgRect && this.imgRect.width ? this.imgRect.width : 0
    this.imgHeight = this.imgRect && this.imgRect.height ? this.imgRect.height : 0
    this.rawWidth = this.rawRect && this.rawRect.width ? this.rawRect.width : 0
    this.rawHeight = this.rawRect && this.rawRect.height ? this.rawRect.height : 0

    this.parent = opts.dom.parentElement
    this.clientWidth = opts.dom.clientWidth
    this.clientHeight = opts.dom.clientHeight

    this.area = document.createElement('div')
    this.area.className = 'crop-con'
    Util.extend(this.area.style, {
        width: this.dom.clientWidth + 'px',
        height: this.dom.clientHeight + 'px',
        position: 'absolute',
        left: this.dom.offsetLeft + 'px',
        top: this.dom.offsetTop + 'px'
    })
    this.parent.appendChild(this.area)

    this.cropView = document.createElement('div')
    this.cropView.className = 'video-crop-view red'
    this.cropView.style.position = 'absolute'
    this.cropView.innerHTML = '<span class="_crop-bg"></span><span class="_crop-left"></span><span class="_crop-right"></span>'
    this.area.appendChild(this.cropView)

    if (this.rect && Object.keys(this.rect).length) {
        let obj = {}
        for (let [item, index] of Object.entries(this.rect)) {
            let temp
            if (item == 'left' || item == 'width') {
                temp = Math.round(index / this.imgWidth * this.clientWidth)
            } else {
                temp = Math.round(index / this.imgHeight * this.clientHeight)
            }
            this[item] = obj[item] = temp
        }
        this.init(obj)
    }

    this.initialize()
}

Main.prototype.init = function (rect) {
    let that = this, offsetLeft = this.dom.offsetLeft, offsetTop = this.dom.offsetTop
    Util.extend(that.cropView.style, {
        display: 'block',
        cursor: 'pointer',
        top: rect.top + 'px',
        left: rect.left + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px'
    })
}

Main.prototype.getView = function () {
    let v = this.area
    let offset = Util.offset(v)
    let orate = v.clientHeight / v.clientWidth
    let rrate = v.offsetHeight / v.offsetWidth
    let contentWidth, contentHeight

    if (rrate > orate) {
        contentWidth = v.offsetWidth
        contentHeight = contentWidth * orate
    } else {
        contentHeight = v.offsetHeight
        contentWidth = contentHeight / orate
    }

    return {
        height: v.offsetHeight,
        width: v.offsetWidth,
        top: offset.top,
        left: offset.left,
        contentTop: offset.top + (v.offsetHeight - contentHeight) / 2,
        contentLeft: offset.left + (v.offsetWidth - contentWidth) / 2,
        contentWidth: contentWidth,
        contentHeight: contentHeight
    }
}

Main.prototype.initialize = function () {
    let that = this

    this._areaMousedownFn = function (ev) {
        that.cropView.addEventListener('mouseout', that.mouseOutFn, false)

        let vView = that.getView()
        let pos = {
            top: ev.pageY - vView.contentTop,
            left: ev.pageX - vView.contentLeft,
        }
        Util.extend(that.cropView.style, {
            display: 'block',
            cursor: 'pointer',
            top: pos.top + 'px',
            left: pos.left + 'px',
            width: 0,
            height: 0
        })
        let mouseupFn = function (ev) {
            if (that.cropView.style.width == '0px' && that.cropView.style.height == '0px') {
                that.cbRect = Object.assign({})
            }
            that.opts.callback && that.opts.callback.call(that, that.cbRect)
            document.body.removeEventListener('mousemove', mousemoveFn)
            document.body.removeEventListener('mouseup', mouseupFn)
        }
        let mousemoveFn = function (ev) {
            let mpos = {
                top: ev.pageY - vView.contentTop,
                left: ev.pageX - vView.contentLeft,
            }

            let top = Math.max(0, Math.min(mpos.top, pos.top)), left = Math.max(0, Math.min(mpos.left, pos.left)), width = Math.max(mpos.left, pos.left) - left, height = Math.max(mpos.top, pos.top) - top

            width = Math.min(width, vView.contentWidth - left)
            height = Math.min(height, vView.contentHeight - top)

            that.top = top
            that.left = left
            that.width = width
            that.height = height
            Util.extend(that.cropView.style, {
                top: top + 'px',
                left: left + 'px',
                width: width + 'px',
                height: height + 'px'
            })
            let rect = {
                left: Math.round(left / that.clientWidth * that.imgWidth),
                top: Math.round(top / that.clientHeight * that.imgHeight),
                width: Math.round(width / that.clientWidth * that.imgWidth),
                height: Math.round(height / that.clientHeight * that.imgHeight)
            }
            that.cbRect = Object.assign({}, rect)
        }

        document.body.addEventListener('mousemove', mousemoveFn, false)
        document.body.addEventListener('mouseup', mouseupFn, false)
    }
    this.parent.addEventListener('mousedown', that._areaMousedownFn, false)
}

Main.prototype.mouseOut = function () {
    let that = this
    that.faceDom.style.display = 'none'
}

Main.prototype.mouseOver = function () {
    let that = this
    that.faceDom.style.display = 'block'
    that.hoverCallbackFn && that.hoverCallbackFn.call(that)
}

export default Main
