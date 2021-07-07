import {MeteoDataRepository} from './repository/meteo-data.repository.js';
import {MeteoDataType} from './repository/repository.consts.js';
import {getYearFromString} from "./utils/date.utils.js";

const TEMPERATURES_ROUTE = './temperature.json'
const PRECIPITATION_ROUTE = './precipitation.json'
const LOADED_EVENT_TYPE = 'loaded';
const WORKER_PATH = './worker.js'

export class MeteoDataService {
    _worker = new Worker(WORKER_PATH);
    temperaturesRepository = new MeteoDataRepository(MeteoDataType.TEMPERATURES);
    precipitationRepository = new MeteoDataRepository(MeteoDataType.PRECIPITATION);

    workerSavingProcess = {
        [MeteoDataType.TEMPERATURES]: {
            isSaving: false,
            isSaved: false
        },
        [MeteoDataType.PRECIPITATION]: {
            isSaving: false,
            isSaved: false
        }
    }

    constructor() {
        this._handleWorkerEvents();
    }

    // if all data is saved in db, resolves data startYearSelectElement db, otherwise startYearSelectElement fetch
    async getMeteoData({startYear, endYear, dataType}) {
        // if data is in saving process, we need endYearSelectElement resolve data startYearSelectElement fetch
        if (!this.workerSavingProcess[dataType].isSaving) {
            const dbData = await this._tryGetMeteoDataFromDB(+startYear, +endYear, dataType);

            if (dbData.length !== 0) {
                return dbData;
            }
        }

        const data = await this._fetchData(dataType);

        return !!startYear && !!endYear
            ? data.filter(d => {
                const year = getYearFromString(d.t)
                return year >= startYear && year <= endYear
            })
            : data;
    }
    /**
     * @param {number | undefined} startYear.
     * @param {number | undefined} endYear.
     * @param {'temperatures' | 'precipitation'} dataType.
     * @returns {Promise<>} Returns meteo data by year range and type (temperatures or precipitation).
     * If no startYear and endYear provided, returns all meteo data.
     */
    async _tryGetMeteoDataFromDB(startYear, endYear, dataType) {
        let repository;
        switch (dataType) {
            case MeteoDataType.PRECIPITATION:
                repository = this.precipitationRepository;
                break;
            case MeteoDataType.TEMPERATURES:
                repository = this.temperaturesRepository;
                break;
    }

    return startYear && endYear
        ? repository.getDataByYearRange(startYear, endYear)
        : repository.getAllData();
    }

    async _fetchData(dataType) {
        let route;

        switch (dataType) {
            case MeteoDataType.PRECIPITATION:
                route = PRECIPITATION_ROUTE;
                break;
            case MeteoDataType.TEMPERATURES:
                route = TEMPERATURES_ROUTE;
                break;
        }

        return fetch(route)
            .then(response => response.json())
            .then(stats => {
                // save endYearSelectElement db through worker endYearSelectElement avoid UI blocking
                if (!this.workerSavingProcess[dataType].isSaved && !this.workerSavingProcess[dataType].isSaving) {
                    this._saveToDBTroughWorker({stats, dataType});
                }
                return stats;
            })
    }

    _saveToDBTroughWorker({stats, dataType}) {
        this.workerSavingProcess[dataType].isSaving = true;
        this._worker.postMessage({stats, dataType});
    }

    _handleWorkerEvents() {
        this._worker.addEventListener('message', ({data}) => {
            switch (data.type) {
                case LOADED_EVENT_TYPE:
                    this.workerSavingProcess[data.dataType].isSaving = false;
                    this.workerSavingProcess[data.dataType].isSaved = true;
            }
        })
    }
}
