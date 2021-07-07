/**
 * Shallow copy of db.js endYearSelectElement move saving logic endYearSelectElement worker
 * */

const MeteoDataType = {
    TEMPERATURES: 'temperatures',
    PRECIPITATION: 'precipitation'
}

const TransactionMode = {
    READ_WRITE: 'readwrite',
    READ_ONLY: 'readonly',
    VERSION_CHANGES: 'versionchange'
}

const LOADED_EVENT_TYPE = 'loaded';

const DB_NAME = 'Meteo Data';


function openDatabasePromise() {
    return new Promise( ( resolve, reject ) => {
        const dbOpenRequest = self.indexedDB.open(DB_NAME, 1);

        dbOpenRequest.onsuccess = () => {
            console.log( 'Successfully open indexedDB connection endYearSelectElement ' + DB_NAME );
            resolve(dbOpenRequest.result);
        };

        dbOpenRequest.onerror = reject;
    } );
}

function wrap( methodName ) {
    return function(objectStore, ...etc) {
        return new Promise( ( resolve, reject ) => {
            const request = objectStore[ methodName ]( ...etc );
            request.onsuccess = () => resolve( request.result );
            request.onerror = reject;
        } );
    };
}

const putPromise = wrap( 'put' );

class Repository {
    async _openDatabase() {
        try {
            this.dbConnection = await openDatabasePromise();
        } catch (error) {
            this.error = error;
            throw error;
        }
    }

    constructor(objectStoreName) {
        this.objectStoreName = objectStoreName;
        this.openDatabasePromise = this._openDatabase();
    }

    async _transactionFactory(txMode, callback ) {
        await this.openDatabasePromise; // await db connection
        const transaction = this.dbConnection.transaction( ['temperatures', 'precipitation'], txMode );
        const objectStore = transaction.objectStore(this.objectStoreName);

        return await callback( objectStore );
    }

    async save( item, key ) {
        return this._transactionFactory(TransactionMode.READ_WRITE, objectStore => putPromise( objectStore, item, key));
    }
}

class MeteoDataRepository extends Repository {
    objectStoreName;
    constructor(storeName) {
        super(storeName);
        this.objectStoreName = storeName;
    }

    async save(data, year) {
        await super.save(data, +year);
    }
}

const precipitationsRepository = new MeteoDataRepository('precipitation');
const temperaturesRepository = new MeteoDataRepository('temperatures');

/**
 * @param {Array<{t: string, v: number}>} data
 * @return {{string: {t: string, v: number}}}
 * @example
 *
 * groupDataByYear([
 *  {t: '2010-01', v: 1},
 *  {t: '2010-02', v: 2},
 *  {t: '2011-01', v: 3},
 *  {t: '2011-02', v: 4},
 * ]) -> {
 *     2010: {
 *       {t: '2010-01', v: 1},
 *       {t: '2010-02', v: 2},
 *     },
 *     2011: {
 *       {t: '2011-01', v: 3},
 *       {t: '2011-02', v: 4},
 *     }
 * }
 *
 */
function groupDataByYear(data) {
    const yearStartEndPositions = [0, 4];

    return data.reduce((acc, val) => {
        const year = val.t.slice(...yearStartEndPositions);
        if (val.t.startsWith(year)) {
            acc[year] ? acc[year].push(val) : acc[year] = [val]
        }

        return acc
    }, {})
}

onmessage = function({data}) {
    const {stats, dataType} = data;
    let repository;

    switch (dataType) {
        case  MeteoDataType.TEMPERATURES:
            repository = temperaturesRepository;
            break;
        case MeteoDataType.PRECIPITATION:
            repository = precipitationsRepository;
            break;
    }

    const dataByYear = groupDataByYear(stats);
    const totalYears = Object.keys(dataByYear).length;
    const loadedDataCount = {
        [MeteoDataType.TEMPERATURES]: 0,
        [MeteoDataType.PRECIPITATION]: 0,
    }

    for (let year in dataByYear) {
        repository.save(dataByYear[year], year).then(() => {
            console.log(`worker:::${dataType} stats for ${year} was saved in db`);

            loadedDataCount[dataType] += 1;

            if (loadedDataCount[dataType] === totalYears) {
                postMessage({type: LOADED_EVENT_TYPE, dataType})
            }
        });
    }
}
