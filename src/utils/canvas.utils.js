export function createCanvas(rootSelector, {width, height}) {
    const root = document.querySelector(rootSelector);

    if (!root) {
        throw new Error('Cannot find root element for canvas');
    }

    const canvas = document.createElement('canvas');

    root.appendChild(canvas);

    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    canvas.width = width * 2;
    canvas.height = height * 2;

    return canvas;
}
