import {DB_NAME, STORE_NAMES} from './repository.consts.js';

export function openDatabasePromise(objectStoreNames, keyPath) {
    return new Promise( ( resolve, reject ) => {
        const dbOpenRequest = window.indexedDB.open(DB_NAME, 1);

        dbOpenRequest.onblocked = () => {
            reject('blocked');
        };

        dbOpenRequest.onerror = err => {
            console.log('Unable open indexedDB');
            reject(err);
        };

        dbOpenRequest.onupgradeneeded = event => {
            const db = event.target.result;
            STORE_NAMES.forEach(name => {
                db.createObjectStore(name, keyPath);
            })
        };

        dbOpenRequest.onsuccess = () => {
            console.log( 'Successfully open indexedDB connection');
            resolve(dbOpenRequest.result);
        };

        dbOpenRequest.onerror = reject;
    } );
}

export function wrap( methodName ) {
    return function(objectStore, ...etc) {
        return new Promise( ( resolve, reject ) => {
            const request = objectStore[ methodName ]( ...etc );
            request.onsuccess = () => resolve( request.result );
            request.onerror = reject;
        } );
    };
}

export const deletePromise = wrap( 'delete' );
export const getAllPromise = wrap( 'getAll' );
export const getPromise = wrap( 'get' );
export const putPromise = wrap( 'put' );
