import * as tulind from "tulind";

export function tulindTest() {
    // testRSI();
    // testBBands();
    testStoch();
}

const inputClose = [81.59, 81.06, 82.87, 83.00, 83.61, 83.15, 82.84, 83.99, 84.55, 84.36, 85.53, 86.54, 86.89, 87.77, 87.29];

function testRSI() {
    const expectRSI = [72.03, 64.93, 75.94, 79.80, 74.71, 83.03, 87.48, 88.76, 91.48, 78.50];

    tulind.indicators.rsi.indicator([inputClose], [5], (err, result) => {
        console.log(err, result);

        // inputClose.shift();
        // tulind.indicators.rsi.indicator([inputClose], [5], (err, result) => {
        //     console.log(err, result);
        // });
    });
}

function testBBands() {
    const inputClose = [85.53, 86.54, 86.89, 87.77, 87.29];

    tulind.indicators.bbands.indicator([inputClose], [5, 2], (err, result) => {
        console.log(err, result);
    });
}

function testStoch() {
    const inputHigh = [82.15, 81.89, 83.03, 83.30, 83.85, 83.90, 83.33, 84.30, 84.84, 85.00, 85.90, 86.58, 86.98, 88.00, 87.87];
    const inputLow = [81.29, 80.64, 81.31, 82.65, 83.07, 83.11, 82.49, 82.30, 84.15, 84.11, 84.03, 85.39, 85.76, 87.17, 87.01];
    const inputClose = [81.59, 81.06, 82.87, 83.00, 83.61, 83.15, 82.84, 83.99, 84.55, 84.36, 85.53, 86.54, 86.89, 87.77, 87.29];

    inputHigh.shift();
    inputLow.shift();
    inputClose.shift();
    tulind.indicators.stoch.indicator([inputHigh, inputLow, inputClose], [5, 3, 3], (err, result) => {
        console.log(err, result);
    });
}