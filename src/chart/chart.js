import {average, chunk} from '../utils/array.utils.js';
import {getDateString} from '../utils/date.utils.js';
import {clamp} from '../utils/math.utils.js';
import {
    BOTTOM_PADDING,
    LEFT_PADDING,
    MIN_DELTA_X,
    RIGHT_PADDING,
    STEPS_COUNT,
    TOP_PADDING,
    DPI_RATIO,
    BIG_TIP_HEIGHT,
    BIG_TIP_WIDTH,
    SMALL_TIP_HEIGHT,
    SMALL_TIP_WIDTH,
    TipPaddings,
    AXIS_COLOR,
    FONT_COLOR,
    FONT_STYLE
} from "./consts.js";
import {setStyles} from "../utils/css.utils.js";

export class Chart {
    get labels() {
        return this._labels;
    }

    set labels(val) {
        this._labels = val;
        this.clear();
        this.drawChart();
    }

    get data() {
        return this._data;
    }

    set data(val) {
        this._data = val;
        this.clear();
        this._updateCollapsedValues();
        this.drawChart();
    }

    _data = []
    _labels = []
    _hoveredValueIndex = null;
    _collapsedValues = []

    get _y0() {
        return this.canvas.height - TOP_PADDING + BOTTOM_PADDING;
    }

    get _yMax() {
        return Math.max(...this._collapsedValues);
    }

    get _yMin() {
        return Math.min(...this._collapsedValues);
    }

    get _scaleFactorY() {
        return this._y0 / (this._yMax - this._yMin);
    }

    get _chartWidth() {
        return this.canvas.width - LEFT_PADDING - RIGHT_PADDING;
    }

    get _axisStepsCount() {
        return STEPS_COUNT < this._collapsedValues.length
            ? STEPS_COUNT
            : this._collapsedValues.length;
    }

    get _axisStepSize() {
        return this._chartWidth / this._axisStepsCount
    }

    constructor({canvas, labels, data, graphColor}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.labels = labels;
        this.data = data;
        this.graphColor = graphColor;

        this._updateCollapsedValues();
        this.drawChart();
        this.initTooltip();
        this._handleMouseMove();
        this._handleMouseLeave();
    }


    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    initTooltip() {
        if (this.toolTipElement) {return;}

        this.toolTipElement = document.createElement('div');
        this.toolTipElement.classList.add('tooltip')
        document.body.appendChild(this.toolTipElement);
    }

    drawChart() {
        this.drawXAxis();
        this.drawYAxis();
        this.drawYLabels();
        this.drawGraph();
    }

    setHoveredValueIndex(x) {
        this._hoveredValueIndex = clamp(
            Math.round((x * DPI_RATIO - LEFT_PADDING) / MIN_DELTA_X),
            0,
            this._collapsedValues.length - 1
        );
    }

    drawPointingCircle() {
        if (this._hoveredValueIndex === null) {return;}

        const d = this._collapsedValues[this._hoveredValueIndex];

        const stepX = (this.canvas.width - LEFT_PADDING- RIGHT_PADDING) / this._collapsedValues.length;;
        const x = LEFT_PADDING + this._hoveredValueIndex * stepX;
        const y = this._y0 - this._scaleFactorY * (d - this._yMin);

        this.drawCircle([x, y], this.graphColor);
    }

    drawYLabels() {
        if (this.labels.length === 0) {return;}

        const labelsChunked = chunk(this.labels, this.labels.length / this._axisStepsCount)
        let labels = labelsChunked.map((periodLabels) => getDateString(new Date(`${periodLabels[0]}`)))
        const lastDates = labelsChunked[labelsChunked.length - 1]
        labels.push(getDateString(new Date(lastDates[lastDates.length - 1])))


        this.ctx.beginPath();

        for (let i = 0; i <= this._axisStepsCount; i++) {
            const x = LEFT_PADDING + this._axisStepSize * i;
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height - BOTTOM_PADDING);
            this.ctx.fillText(labels[i], x -  50, this.canvas.height - 20)
        }

        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawYAxis() {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = AXIS_COLOR;
        this.ctx.font = FONT_STYLE;
        this.ctx.fillStyle = FONT_COLOR;

        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawCircle([x,y],   color) {
        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = '#fff';
        this.ctx.arc(x, y, 10, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.closePath();

    }

    drawXAxis() {
        this.ctx.beginPath();
        this.ctx.lineWidth = 1;
        this.ctx.strokeStyle = AXIS_COLOR;
        this.ctx.font = FONT_STYLE;
        this.ctx.fillStyle = FONT_COLOR;

        const stepsCount = STEPS_COUNT < this._collapsedValues.length
            ? STEPS_COUNT
            : this._collapsedValues.length;

        const step = this._y0 / stepsCount;
        const textStep = (this._yMax - this._yMin) / stepsCount;

        for (let i = 0; i <= stepsCount; i++) {
            const y = step * i;
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width - RIGHT_PADDING, y);
            this.ctx.fillText((this._yMax - textStep * i).toFixed(1), 10, y - 5)
        }
        this.ctx.stroke();
        this.ctx.closePath();
    }

    drawGraph() {
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = this.graphColor;

        const stepsCount = this._collapsedValues.length;
        const stepX = this._chartWidth / stepsCount;
        const scaleFactorY = this._scaleFactorY;

        this.ctx.beginPath();
        this._collapsedValues.forEach((d, i) => {
            this.ctx.lineTo(LEFT_PADDING + i * stepX, this._y0 - scaleFactorY * (d - this._yMin))
        })

        this.ctx.stroke();
        this.ctx.closePath();

        this.ctx.beginPath();

        this.ctx.stroke();
        this.ctx.closePath();
    }

    // if there are to many points we collapse points to its average value
    _updateCollapsedValues() {
        const width = this._chartWidth;
        const dotsCount = Math.round(width / MIN_DELTA_X);

        if (this.data.length - 1 <= dotsCount) {
            this._collapsedValues = this.data;
            return;
        }

        const data = chunk(this.data, this.data.length/dotsCount);

        this._collapsedValues = data.reduce((acc, val) => {
            return [
                ...acc,
                average(val)
            ]
        }, []);
    }

    _hideTooltip() {
        setStyles(this.toolTipElement, {
            display: 'none'
        })
    }

    _showTooltip() {
        const stepsCount = this._collapsedValues.length;
        const stepX = (this.canvas.width - LEFT_PADDING- RIGHT_PADDING) / stepsCount;
        const scaleFactorY = this._scaleFactorY;

        const x = LEFT_PADDING + this._hoveredValueIndex * stepX;
        const d = this._collapsedValues[this._hoveredValueIndex]
        const y = this._y0 - scaleFactorY * (d - this._yMin);


        const passTheHalfY = y > (this.canvas.height - BOTTOM_PADDING) / 2;
        const passTheHalfX = this._collapsedValues.length / 2 < this._hoveredValueIndex;

        const dotsCount = Math.round(this._chartWidth / MIN_DELTA_X);
        const labels = chunk(this.labels, this.labels.length/dotsCount)[this._hoveredValueIndex];
        const data = chunk(this.data, this.labels.length/dotsCount)[this._hoveredValueIndex];

        const dateFormat = {year: 'numeric', month: 'long', day: 'numeric'}
        const l = `${getDateString(labels[0], dateFormat)} - ${getDateString(labels[labels.length - 1], dateFormat)}`;

        const paddingTop = getTipPaddingTop(passTheHalfY, labels.length === 1)
        const paddingLeft = getTipPaddingLeft(passTheHalfX, labels.length === 1)

        setStyles(this.toolTipElement, {
            top: (y / DPI_RATIO) + paddingTop + 'px',
            left: (x / DPI_RATIO) + paddingLeft  + 'px'
        });

        if (labels.length > 1) {
            this.toolTipElement.innerHTML = getTipForDateRange({
                dates: l,
                average: (data.reduce((acc, val) => acc + val) / data.length).toFixed(2),
                min: Math.min(...data),
                max: Math.max(...data)
            })

            setStyles(this.toolTipElement, {
                width: `${BIG_TIP_WIDTH}px`,
                height: `${BIG_TIP_HEIGHT}px`
            });
        }

        if (labels.length === 1) {
            this.toolTipElement.innerHTML = getTipForSingleDateRange({
                date: getDateString(labels[0], dateFormat),
                value: data
            })

            setStyles(this.toolTipElement, {
                width: `${SMALL_TIP_WIDTH}px`,
                height: `${SMALL_TIP_HEIGHT}px`
            });
        }

        this.toolTipElement.style.display = 'block';
    }

    _handleMouseMove() {
        this.canvas.addEventListener('mousemove',  e => {
            const draw = () => {
                this.clear();

                this.setHoveredValueIndex(e.offsetX);
                this.drawPointingCircle();

                this.drawXAxis();
                this.drawYAxis();
                this.drawYLabels();
                this.drawGraph();
                this._showTooltip();
            }

            requestAnimationFrame(draw)
        })
    }

    _handleMouseLeave() {
        this.canvas.addEventListener('mouseleave',  () => {
            this._hoveredValueIndex = null;

            this.clear();
            this.drawChart();
            this._hideTooltip();
        })
    }
}

function getTipForDateRange({dates, average, min, max}) {
    return `
        <h4>${dates}</h4>
        <p>Среднее значение: ${average}</p>
        <p>Минимальное знаачение: ${min}</p>
        <p>Максимальное значение: ${max}</p>
    `
}

function getTipForSingleDateRange({date, value}) {
    return `
        <h4>${date}</h4>
        <p>значение: ${value}</p>
    `
}

function getTipPaddingLeft(isCursorPassTheHalf, isSmall) {
    const tipSize = isSmall ? 'SMALL_TIP' : 'BIG_TIP';
    const tipPosition = isCursorPassTheHalf ? 'LEFT' : 'RIGHT';

    const paddingKey = `${tipSize}_${tipPosition}`;

    return TipPaddings[paddingKey];
}

function getTipPaddingTop(isCursorPassTheHalf, isSmall) {
    const tipSize = isSmall ? 'SMALL_TIP' : 'BIG_TIP';
    const tipPosition = isCursorPassTheHalf ? 'TOP' : 'BOTTOM';

    const paddingKey = `${tipSize}_${tipPosition}`;

    return TipPaddings[paddingKey];
}

