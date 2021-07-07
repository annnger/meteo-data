import {State} from './src/state.js'
import {Chart} from './src/chart/chart.js';
import {createCanvas} from './src/utils/canvas.utils.js'
import {MeteoDataType} from "./src/repository/repository.consts.js";
import {MeteoDataService} from "./src/meteo-data.service.js";

const INITIAL_STATE = {
    temperatures: [],
    precipitations: [],
    dataType: MeteoDataType.TEMPERATURES
}

class ChartPage {
    temperaturesButtonElement = document.querySelector('#temperatures-button');
    precipitationButtonElement = document.querySelector('#precipitation-button');

    startYearSelectElement = document.querySelector('#from');
    endYearSelectElement = document.querySelector('#to');
    title = document.querySelector('#graph-title');

    canvas = createCanvas('.root', {width: 1200, height: 600});
    chart = null;

    constructor(state, meteoDataService) {
        this.state = state;
        this.meteoDataService = meteoDataService

        this._handleButtonsClick()
    }

    async init() {
        this._handleStateChanges();
        this._handleDateRangeChanges();
        this._initChart();
        await this._loadInitialData();
    }

    _initChart() {
        if (this.chart) {return;}
        this.chart = new Chart({
            canvas: this.canvas,
            labels: [],
            data: [],
            graphColor: '#04B19B'
        });
    }

    async _loadInitialData() {
        const tempsByYear = await this.meteoDataService.getMeteoData({dataType: MeteoDataType.TEMPERATURES});
        const temps = tempsByYear.flat();

        let minDate = Math.min(...temps.map(t => new Date(t.t).getTime()))
        let maxDate = Math.max(...temps.map(t => new Date(t.t).getTime()))

        minDate = new Date(minDate).getFullYear()
        maxDate = new Date(maxDate).getFullYear()

        this._fillDateRangesOptions(minDate, maxDate);

        this.state.startYear = minDate;
        this.state.endYear = maxDate;
    }

    _handleDateRangeChanges() {
        this.startYearSelectElement.addEventListener('change', e => {
            const startYear = e.target.value;

            if (startYear > this.state.endYear) {
                this.state.endYear = startYear;
            }
            this.state.startYear = startYear;
        });

        this.endYearSelectElement.addEventListener('change', e => {
            const endYear = e.target.value;

            if (endYear < this.state.startYear) {
                this.state.startYear = endYear;
            }

            this.state.endYear = +e.target.value;
        });
    }

    _handleStateChanges() {
        this.state.changes(async ({startYear, endYear, dataType}) => {
            this.startYearSelectElement.value = startYear;
            this.endYearSelectElement.value = endYear;

            const statsGroupedByYear = await this.meteoDataService.getMeteoData({
                dataType,
                startYear,
                endYear
            });
            const flatStats = statsGroupedByYear.flat();
            const labels = flatStats.map(t => t.t);
            const data = flatStats.map(t => t.v);

            if ((dataType) === MeteoDataType.TEMPERATURES) {
                this.chart.graphColor = '#04B19B';
            }

            if ((dataType) === MeteoDataType.PRECIPITATION) {
                this.chart.graphColor = '#0460b1';
            }

            this.chart.data = data;
            this.chart.labels = labels;

            this._setTitleText(dataType);
        }, ['startYear', 'endYear', 'dataType']);
    }

    _handleButtonsClick() {
        this.temperaturesButtonElement.addEventListener('click', () => {
            this.state.dataType = 'temperatures';
        });

        this.precipitationButtonElement.addEventListener('click', () => {
            this.state.dataType = 'precipitation';
        })
    }

    _setTitleText(dataType) {
        switch (dataType) {
            case MeteoDataType.PRECIPITATION:
                this.title.innerText = 'Осадки'
                break;
            case MeteoDataType.TEMPERATURES:
                this.title.innerText = 'Температура '
                break;
        }
    }

    _fillDateRangesOptions(start, end) {
        for (let i = start; i <= end; i++) {
            const optionFrom = document.createElement("option");
            const optionTo = document.createElement("option");
            optionFrom.text = i;
            optionTo.text = i;
            this.startYearSelectElement.add(optionFrom);
            this.endYearSelectElement.add(optionTo);
        }
    }
}

const page = new ChartPage(
    new State(INITIAL_STATE),
    new MeteoDataService()
)

page.init();
