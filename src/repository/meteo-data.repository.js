import {RepositoryBase} from './repository.base.js';

export class MeteoDataRepository extends RepositoryBase {
    constructor(storeName) {
        super(storeName);
    }

    async save(month, data) {
        await this.save(data, month);
    }

    async getDataByYearRange(startYear, endYear) {
        const range = IDBKeyRange.bound(startYear, endYear);

        return await this.findAll(range);
    }

    async getAllData() {
        return await this.findAll();
    }
}
