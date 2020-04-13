import {InsightDataset, InsightDatasetKind} from "./IInsightFacade";
import InsightFacade from "./InsightFacade";

let fs = require("fs-extra");

export function isInvalidString(s: string): boolean {
    return (s === null || s === undefined || (s.trim().length === 0));
}
export function isObject (object: any) {
    return !(typeof object !== "object" || Array.isArray(object) || object === null || object === undefined);
}
export function IsValidJSON(str: string) {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}
export function idExists(id: string, data: InsightDataset[]): boolean {
    let found = false;
    for (const item of data) {
        if (item.id === id) {
            found = true;
            break;
        }
    }
    return found;
}
export function getKind (dataset: InsightDataset[], id: string): any {
    const result = dataset.find((item) => item.id === id);
    return result.kind;
}

export function getDatasetType(dataset: any[]): InsightDatasetKind {
    if (dataset[0].hasOwnProperty("courses_dept")) {
        return InsightDatasetKind.Courses;
    } else {
        return InsightDatasetKind.Rooms;
    }
}

export function loadDisk(instance: InsightFacade) {
    const dataDir = "./data";
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }
    // Get Datasets from Disk into Memory
    let dir = "./data/";
    let files = fs.readdirSync(dir);
    for (let item of files) {
        let filePath = dir + item;
        let fileContent = fs.readFileSync(filePath, "utf8");
        let content: any[] = JSON.parse(fileContent);

        if (content.length === 0) {
            fs.unlinkSync(filePath);
        } else {
            if (idExists(item, instance.dataSetList)) {
                continue;
            }
            const type = getDatasetType(content);
            const newDataset: InsightDataset = {id: item, kind:
                type, numRows:
                content.length};
            instance.datasetMap.set(item, content);
            instance.dataSetList.push(newDataset);
        }
    }
}
