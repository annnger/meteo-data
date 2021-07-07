import {TransactionMode, DB_NAME, STORE_NAMES} from './repository.consts.js';
import {openDatabasePromise, deletePromise, getAllPromise, getPromise, putPromise} from './repository.utils.js'

export class RepositoryBase {
    constructor(objectStoreName) {
        this.objectStoreName = objectStoreName;
        this.openDatabasePromise = this._openDatabase();
    }

    async findAll(key) {
        return this._transactionFactory(TransactionMode.READ_ONLY, objectStore => getAllPromise(objectStore, key));
    }

    async findById( key ) {
        return this._transactionFactory(TransactionMode.READ_ONLY, objectStore => getPromise(objectStore, key));
    }

    async deleteById( key ) {
        return this._transactionFactory(TransactionMode.READ_WRITE, objectStore => deletePromise(objectStore, key));
    }

    async save( item, key ) {
        return this._transactionFactory(TransactionMode.READ_WRITE, objectStore => putPromise( objectStore, item, key));
    }

    async _openDatabase( keyPath ) {
        try {
            this.dbConnection = await openDatabasePromise(this.objectStoreName, keyPath );
        } catch ( error ) {
            this.error = error;
            throw error;
        }
    }

    async _transactionFactory(txMode, callback ) {
        await this.openDatabasePromise; // await db connection
        const transaction = this.dbConnection.transaction(STORE_NAMES, txMode );
        const objectStore = transaction.objectStore(this.objectStoreName);

        return await callback( objectStore );
    }
}

