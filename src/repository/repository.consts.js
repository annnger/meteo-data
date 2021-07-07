export const TransactionMode = {
    READ_WRITE: 'readwrite',
    READ_ONLY: 'readonly',
    VERSION_CHANGES: 'versionchange'
}

export const MeteoDataType = {
    TEMPERATURES: 'temperatures',
    PRECIPITATION: 'precipitation'
}

export const DB_NAME = 'Meteo Data';
export const STORE_NAMES = [
    ...Object.values(MeteoDataType)
]
