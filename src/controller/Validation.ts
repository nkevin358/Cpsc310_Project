import {isObject} from "./Helpers";
export function isValidQuery(query: any): boolean {
    if (!isObject(query)) {
        return false;
    }
    const keys = Object.keys(query);
    if (keys.length > 3) {
        return false;
    }
    // WHERE and OPTIONS keys must be there
    if (!keys.includes("WHERE") || !keys.includes("OPTIONS")) {
        return false;
    }
    // WHERE and OPTIONS must be objects non arrays and not null
    const where = query["WHERE"];
    const options = query["OPTIONS"];
    if (!isObject(where)) {
        return false;
    }
    // WHERE can have at most 1 key
    const whereKeys = Object.keys(where);
    if (whereKeys.length > 1) {
        return false;
    }
    // Check if Filters are valid
    if (whereKeys.length === 1 && !isValidFilter(where)) {
        return false;
    }
    if (!isOptionsValid(options)) {
        return false;
    }
    const columns = options.COLUMNS;
    const id = columns[0].split("_")[0];
    const hasTrans = query.hasOwnProperty("TRANSFORMATIONS");
    if (!checkColumns(columns, id, hasTrans)) {
        return false;
    }
    if (keys.length === 3 && !query.TRANSFORMATIONS) {
        return false;
    }
    if (query.TRANSFORMATIONS) {
        return isTransValid(query.TRANSFORMATIONS, options);
    }
    return true;
}
function isTransValid(trans: any, options: any): boolean {
    const columns = options["COLUMNS"];
    const transKeys = Object.keys(trans);
    let groupApplyColumns: string[] = [];
    if (transKeys.length === 2 && transKeys.includes("GROUP") && transKeys.includes("APPLY")) {
        const group = trans.GROUP;
        if (!Array.isArray(group)) {
            return false;
        }
        if (group.length === 0) {
            return false;
        }
        for (let item of group) {
            if (!correctColumn(item)) {
                return false;
            }
            groupApplyColumns.push(item);
        }
        // Check Apply Valid
        let apply = trans.APPLY;
        if (!Array.isArray(apply)) {
            return false;
        }
        for (let item of apply) {
            if (!isApplyItemValid(item)) {
                return false;
            }
            const applyKeys = Object.keys(item);
            if (groupApplyColumns.includes(applyKeys[0])) {
                return false;
            }
            groupApplyColumns.push(applyKeys[0]);
        }
        return columns.every(function (key: string) {
            return groupApplyColumns.indexOf(key) > -1;
        });
    } else {
        return false;
    }
}
function isApplyItemValid (apply: any): boolean {
    if (!isObject(apply)) {
        return false;
    }
    let applyKeys = Object.keys(apply);
    if (applyKeys.length !== 1) {
        return false;
    }
    if (applyKeys[0].includes("_")) {
        return false;
    }
    let applyRule = apply[applyKeys[0]];
    if (!isObject(applyRule)) {
        return false;
    }
    let applyRuleKeys = Object.keys(applyRule);
    if (applyRuleKeys.length !== 1) {
        return false;
    }
    const rules = ["MAX", "AVG", "SUM", "COUNT", "MIN"];
    if (!rules.includes(applyRuleKeys[0])) {
        return false;
    }
    const applyColumn = applyRule[applyRuleKeys[0]];
    if (applyRuleKeys[0] !== "COUNT") {
        if (checkKeyType(applyColumn) !== "NUM") {
            return false;
        }
    }
    return correctColumn(applyColumn);
}
function checkColumns(key: any[], id: any, hasTrans: boolean): boolean {
    for (let item of key) {
        if (typeof item !== "string") {
            return false;
        }
        if (!item.includes("_")) {
            if (hasTrans) {
                continue;
            }
            return false;
        }
        if (item.split("_")[0] !== id) {
            return false;
        }
        if (!correctColumn(item)) {
            return false;
        }
    }
    return true;
}
function correctColumn (column: string): boolean {
    const allKeys = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid",
        "lat", "lon", "seats", "fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
    const keyValuePair: string[] = column.split("_");
    const attribute: string = keyValuePair[1];
    return allKeys.includes(attribute);
}
function isOptionsValid(options: any): boolean {
    if (!isObject(options)) {
        return false;
    }
    const optionKeys = Object.keys(options);
    // OPTIONS must have COLUMNS key + optional ORDER key
    if (optionKeys.length > 2 || !optionKeys.includes("COLUMNS")) {
        return false;
    }
    const columns = options["COLUMNS"];
    if (!Array.isArray(columns) || columns.length === 0) {
        return false;
    }
    if (optionKeys.length === 2) {
        if (options.ORDER) {
            return isOrderValid(options.ORDER, columns);
        }
        return false;
    }
    return true;
}
function isOrderValid(order: any, columns: any[]): boolean {
    if (typeof order === "string") {
        return columns.includes(order);
    }
    if (isObject(order)) {
        return validOrderObject(order, columns);
    } else {
        return false;
    }
}
function validOrderObject(order: any, columns: any[]): boolean {
    if (!order.keys || !order.dir ) {
        return false;
    }
    if (order.dir === "UP" || order.dir === "DOWN") {
        const orderKeys = order.keys;
        if (!Array.isArray(orderKeys) || orderKeys.length === 0) {
            return false;
        }
        return orderKeys.every(function (key) {
            return columns.indexOf(key) > -1;
        });
    } else {
        return false;
    }
}
function isValidFilter(filter: any): boolean {
    if (typeof filter !== "object" || filter === null || Array.isArray(filter)) {
        return false;
    }
    let filterKey: string[] = Object.keys(filter);
    let keys: string = filterKey[0];
    if (filterKey.length !== 1) {
        return false;
    }
    const comparison = filter[keys];
    const val = Object.values(comparison);
    const comparisonKeys = Object.keys(comparison);
    // Checking EQ LT GT
    if (isNumFilter(keys)) {
        if (typeof comparison !== "object" || comparison === null || Array.isArray(comparison)) {
            return false;
        }
        if (checkKeyType(comparisonKeys[0]) !== "NUM" || comparisonKeys.length !== 1 ) {
            return false;
        }
        return typeof val[0] === "number";
    }
    // Checking IS
    if (keys === "IS") {
        if (typeof comparison !== "object" || comparison === null || Array.isArray(comparison)) {
            return false;
        }
        if (comparisonKeys.length !== 1 || checkKeyType(comparisonKeys[0]) !== "STRING") {
            return false;
        }
        if (typeof val[0] !== "string") {
            return false;
        }
        return checkWildKey(comparison);
    }
    // Checking NOT
    if (keys === "NOT") {
        return isValidFilter(filter[keys]);
    }
    // Checking AND OR
    if (isLogicFilter(keys)) {
        if (!Array.isArray(filter[keys]) || filter[keys].length === 0) {
            return false;
        }
        for (const item of filter[keys]) {
            if (!isValidFilter(item)) {
                return false;
            }
        }
        return true;
    } else {
        return false;
    }
}
function checkWildKey(comparison: any): boolean {
    let valStringArray: string[] = Object.values(comparison);
    const valString: string = valStringArray[0];
    const wildCards = valString.match(/\*/g);
    let wildCardCount: number = 0;
    if (wildCards !== null) {
        wildCardCount = wildCards.length;
    }
    if (wildCardCount > 0) {
        if (wildCardCount === 1) {
            if (valString.startsWith("*") || valString.endsWith("*")) {
                return true;
            }
        } else if (wildCardCount === 2) {
            if (valString.startsWith("*") && valString.endsWith("*")) {
                return true;
            }
        }
        return false;
    }
    return true;
}
function isNumFilter(filter: string): boolean {
    const compFilters = ["LT", "GT", "EQ"];
    return (compFilters.indexOf(filter) > -1);
}
function isLogicFilter(filter: string): boolean {
    const logicFilters = ["AND", "OR"];
    return (logicFilters.indexOf(filter) > -1);
}
export function checkKeyType(key: string): string {
    const column: string = key.substring(key.indexOf("_") + 1);
    const numColumns: string[] = ["avg", "pass", "fail", "audit", "year", "lat", "lon", "seats"];
    const stringColumns: string[] = ["dept", "id", "instructor", "title", "uuid", "fullname", "shortname",
        "number", "name", "address", "type", "furniture", "href" ];
    if (numColumns.indexOf(column) !== -1) {
        return "NUM";
    } else if (stringColumns.indexOf(column) !== -1 ) {
        return "STRING";
    } else {
        return "ERROR";
    }
}
