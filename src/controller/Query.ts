import {InsightDatasetKind, InsightError, InsightSection} from "./IInsightFacade";
import {checkKeyType} from "./Validation";
import {isObject} from "./Helpers";
import {handleOperator} from "./Aggregation";

export function Partition(query: any, data: InsightSection[], id: string, superSet: any[], kind: any): any[] {
    if (query.GT || query.LT || query.EQ || query.IS) {
        let filterSymbol = Object.keys(query)[0];
        let key = Object.keys(query[filterSymbol])[0];
        let datasetID = key.split("_")[0];
        if (datasetID !== id) {
            throw new InsightError("query on different dataset");
        }
        let column: string  = key.split("_")[1].toString();
        let input = query[filterSymbol][key];
        if (filterSymbol === "GT") {
            return filterGT(data, input, column, kind);
        }
        if (filterSymbol === "LT") {
            return filterLT(data, input, column, kind);
        }
        if (filterSymbol === "EQ") {
            return filterEQ(data, input, column, kind);
        }
        if (filterSymbol === "IS") {
            return filterIS(data, input, column, kind);
        }
    } else if (query.AND) {
        let sets = [];
        for (let item of query.AND) {
            sets.push(Partition(item, data, id, superSet, kind));
        }
        return sets.reduce(intersect);
    } else if (query.OR) {
        let sets: any[] = [];
        for (let item of query.OR) {
            sets = sets.concat(Partition(item, data, id, superSet, kind));
        }
        let union = new Set(sets);
        return Array.from(union);
    } else if (query.NOT) {
        let sets: any[] = [];
        sets = sets.concat(Partition(query.NOT, data, id, superSet, kind));
        let union = new Set(sets);
        let filtered = Array.from(union);
        return superSet.filter((e: InsightSection) => !filtered.includes(e));
    } else {
        return data;
    }
}
// Filter Helpers
function filterGT(data: any[], input: number, column: string, kind: any ): InsightSection[] {
    const coursesColumn: string = "courses_".concat(column);
    const roomsColumn: string = "rooms_".concat(column);
    let queryColumn = "";
    if (kind === "rooms") {
        queryColumn = roomsColumn;
    } else {
        queryColumn = coursesColumn;
    }
    if (checkKeyType(queryColumn) === "NUM") {
        return data.filter((section) => section[queryColumn] > input);
    } else {
        throw new InsightError("Column not valid");
    }
}
function filterLT(data: any[], input: number, column: string, kind: any ): InsightSection[] {
    const coursesColumn: string = "courses_".concat(column);
    const roomsColumn: string = "rooms_".concat(column);
    let queryColumn = "";
    if (kind === "rooms") {
        queryColumn = roomsColumn;
    } else {
        queryColumn = coursesColumn;
    }
    if (checkKeyType(queryColumn) === "NUM") {
        return data.filter((section) => section[queryColumn] < input);
    } else {
        throw new InsightError("Column not valid");
    }
}
function filterEQ(data: any[], input: number, column: string, kind: any ): InsightSection[] {
    const coursesColumn: string = "courses_".concat(column);
    const roomsColumn: string = "rooms_".concat(column);
    let queryColumn = "";
    if (kind === "rooms") {
        queryColumn = roomsColumn;
    } else {
        queryColumn = coursesColumn;
    }
    if (checkKeyType(queryColumn) === "NUM") {
        return data.filter((section) => section[queryColumn] === input);
    } else {
        throw new InsightError("Column not valid");
    }
}
function filterIS(data: any[], input: string, column: string, kind: any ): InsightSection[] {
    if (input.indexOf("*") !== -1) {
        return filterWildCardIS(data, input, column, kind);
    }
    const coursesColumn: string = "courses_".concat(column);
    const roomsColumn: string = "rooms_".concat(column);
    let queryColumn = "";
    if (kind === "rooms") {
        queryColumn = roomsColumn;
    } else {
        queryColumn = coursesColumn;
    }
    if (checkKeyType(queryColumn) === "STRING") {
        return data.filter((section) => section[queryColumn] === input);
    } else {
        throw new InsightError("Column not valid");
    }
}
// Helper to filter based on wildcard
function filterWildCardIS(data: any[], input: string, column: string, kind: any): InsightSection[] {
    let stringVal = input;
    const coursesColumn: string = "courses_".concat(column);
    const roomsColumn: string = "rooms_".concat(column);
    let queryColumn = "";
    if (kind === "rooms") {
        queryColumn = roomsColumn;
    } else {
        queryColumn = coursesColumn;
    }
    if (checkKeyType(queryColumn) === "STRING") {
        if (input.startsWith("*")) {
            if (input.endsWith("*")) {
                stringVal = stringVal.substr(1, stringVal.length - 2);
                let pattern = new RegExp(stringVal);
                return data.filter((section) => pattern.test(section[queryColumn]));
            } else {
                stringVal = stringVal.substr(1);
                return data.filter((section) => section[queryColumn].endsWith(stringVal));
            }
        } else if (input.endsWith("*")) {
            stringVal = stringVal.substr(0, stringVal.length - 2);
            return data.filter((section) => section[queryColumn].startsWith(stringVal));
        } else {
            throw new InsightError("Column not valid");
        }
    }
    throw new InsightError("Column not valid");
}
function intersect(a: InsightSection[], b: InsightSection[]) {
    return a.filter((value) => b.includes(value));
}

export function orderSort(trimedData: any[], order: any, kind: string): any[] {
    let sorted = [];
    if (typeof order === "string") {
        sorted = trimedData.sort((a, b) => {
            let column = order.split("_")[1];
            let columnSort = kind.concat("_").concat(column);
            if (a[columnSort] > b[columnSort]) {
                return 1;
            }
            if (a[columnSort] < b[columnSort]) {
                return -1;
            }
            return 0;
        });
    } else {
        // order is object
        const orderKeys = order.keys;
        const dir = order.dir;
        let direction: number = 1;
        if (dir === "DOWN") {
            direction = -1;
        }
        sorted = trimedData.sort((a, b) =>  {
            let i = 0, result = 0;
            while (i < orderKeys.length && result === 0) {
                let columnSort = orderKeys[i];
                if (orderKeys[i].includes("_")) {
                    let column = orderKeys[i].split("_")[1];
                    columnSort = kind.concat("_").concat(column);
                }
                result = direction * (a[columnSort] < b[columnSort] ? -1 :
                    (a[columnSort] > b[columnSort] ? 1 : 0));
                i++;
            }
            return result;
        });
    }
    return sorted;
}
export function getColumn(filterData: any[], column: string[], kind: string, trans: any): any {
    let result: any = [];
    let coln;
    if (!isObject(trans)) {
        for (let data of filterData) {
            let newSec: { [key: string]: any } = {};
            for (coln of column) {
                const coursesColn = kind.concat("_").concat(coln.split("_")[1]);
                newSec[coursesColn] = data[coursesColn];
            }
            result.push(newSec);
        }
        return result;
    } else {
        let group = trans.GROUP;
        let apply: any[] = trans.APPLY;
        let groups = groupData(filterData, group);
        for (let groupArr of groups) {
            let newGroup: any = {};
            // Handle Apply Rules
            for (let applyrule of apply) {
                const operatorName = Object.keys(applyrule)[0];
                const operatorObj = applyrule[operatorName];
                const operator = Object.keys(operatorObj)[0];
                const operatorColumn = operatorObj[operator];
                if (!column.includes(operatorName)) {
                    continue;
                }
                let operatorValue = handleOperator (operator, operatorColumn, groupArr, kind);
                newGroup[operatorName] = operatorValue;
            }
            for (coln of column) {
                // Column was handled in Apply Rules
                if (!coln.includes("_")) {
                    continue;
                }
                const dataColn = kind.concat("_").concat(coln.split("_")[1]);
                newGroup[dataColn] = groupArr[0][dataColn];
            }
            // Add item to result
            result.push(newGroup);
        }
        return result;
    }
}

function groupData (dataset: any[], keys: string[]): any[][] {
    let groups = new Map<string, any[]>();
    for (let item of dataset) {
        let mapKey: string = "";
        for (let key of keys) {
            mapKey = mapKey.concat(item[key]);
        }
        // If Group already exist just add item
        if (groups.has(mapKey)) {
            groups.get(mapKey).push(item);
        } else {
            // Create Group array
            let newGroup: any[] = [item];
            groups.set(mapKey, newGroup);
        }
    }
    let result: any[][] = [];
    groups.forEach( (key) => {
            result.push(key);
        }
    );
    return result;
}
