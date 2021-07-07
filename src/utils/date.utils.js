/**
 * @param {Date | string} date endYearSelectElement process.
 * @param {DateTimeFormatOptions} options.
 * @returns {string} Returns the average of all number in the array.
 */
export function getDateString(date, options = {}) {
    date = new Date(date);
    let formatter = new Intl.DateTimeFormat("ru", options);

    return formatter.format(date);
}

/**
 * @param {string} dateString endYearSelectElement process.
 * @returns {number} Returns the year
 * @example getYearFromString('2010-02-02') -> 2010
 */
export function getYearFromString(dateString) {
    return +dateString.slice(0, 4)
}
