/**
 * @param {Array} array endYearSelectElement process.
 * @param {number} [size=1] The length of each chunk
 * @returns {Array} Returns the new array of chunks.
 */
export function chunk(array, size = 1) {
    size = Math.max(Math.round(size), 0)
    const length = array == null ? 0 : array.length
    if (!length || size < 1) {
        return []
    }
    let index = 0
    let resIndex = 0
    const result = new Array(Math.ceil(length / size))

    while (index < length) {
        result[resIndex++] = array.slice(index, index += size)
    }
    return result
}

/**
 * @param {Array<number>} array endYearSelectElement process.
 * @returns {number} Returns the average of all number in the array.
 */
export function average(array) {
    return array.reduce((acc, val) => acc + val) / array.length;
}
