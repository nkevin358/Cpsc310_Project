let Decimal = require("decimal.js");

export function handleOperator (operator: string, operatorColumn: string, group: any[], kind: string): number {
    if (operator === "SUM") {
        return handleSum (operatorColumn, group, kind);
    }
    if (operator === "MIN") {
        return handleMin (operatorColumn, group, kind);
    }
    if (operator === "MAX") {
        return handleMax (operatorColumn, group, kind);
    }
    if (operator === "AVG") {
        return handleAvg (operatorColumn, group, kind);
    }
    if (operator === "COUNT") {
        return handleCount (operatorColumn, group, kind);
    }
}
export function handleSum (column: string, group: any[], kind: string): number {
    let sum = new Decimal(0);
    const dataColn = kind.concat("_").concat(column.split("_")[1]);
    for (let item of group) {
        let val = item[dataColn];
        let current = new Decimal(val);
        sum = Decimal.add(sum, current);
    }
    let sumNum = sum.toNumber();
    return Number(sumNum.toFixed(2));
}

export function handleMin (column: string, group: any[], kind: string): number {
    const dataColn = kind.concat("_").concat(column.split("_")[1]);
    let min = group[0][dataColn];
    for (let item of group) {
        if (item[dataColn] < min) {
            min = item[dataColn];
        }
    }
    return min;
}

export function handleMax (column: string, group: any[], kind: string): number {
    const dataColn = kind.concat("_").concat(column.split("_")[1]);
    let max = group[0][dataColn];
    for (let item of group) {
        if (item[dataColn] > max) {
            max = item[dataColn];
        }
    }
    return max;
}

export function handleCount (column: string, group: any[], kind: string): number {
    let countArray: any[] = [];
    const dataColn = kind.concat("_").concat(column.split("_")[1]);
    for (let item of group) {
        if (!countArray.includes(item[dataColn])) {
            countArray.push(item[dataColn]);
        }
    }
    return countArray.length;
}

export function handleAvg (column: string, group: any[], kind: string): number {
    let sum = new Decimal(0);
    const dataColn = kind.concat("_").concat(column.split("_")[1]);
    for (let item of group) {
        let val = item[dataColn];
        let current = new Decimal(val);
        sum = Decimal.add(sum, current);
    }
    let sumNum = sum.toNumber();
    let avg = sumNum / group.length;
    return Number(avg.toFixed(2));
}
