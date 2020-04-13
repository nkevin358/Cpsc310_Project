import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    InsightSection,
    NotFoundError
} from "./IInsightFacade";
import * as path from "path";
import {isValidQuery} from "./Validation";
import {getKind, idExists, isInvalidString, IsValidJSON, getDatasetType, loadDisk} from "./Helpers";
import {getColumn, orderSort, Partition} from "./Query";
import {addNewRoomType} from "./AddRooms";
import JSZip = require("jszip");
import Log from "../Util";

let fs = require("fs-extra");
let parse5 = require("parse5");
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
    public dataSetList: InsightDataset[];
    // added this for store in memory
    public datasetMap: Map<string, any[]>;
    constructor() {
        this.dataSetList = [];
        this.datasetMap = new Map<string, any[]>();
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        loadDisk(this);
        return new Promise<string[]>((resolve, reject) => {
            let isValid = true;
            if (isInvalidString(id) || isInvalidString(content) || isInvalidString(kind)
            || id.includes("_") || idExists(id, this.dataSetList)) {
                isValid = false;
                reject(new InsightError("invalid input id"));
            }
            if (kind === InsightDatasetKind.Rooms && isValid) {
                addNewRoomType(id, content, kind, this.datasetMap, this.dataSetList).then((names: []) =>
                    resolve(names)
                ).catch((err: any) => reject(err));
            }
            if (kind === InsightDatasetKind.Courses && isValid) {
                let zip = new JSZip();
                let promises: any[] = [], names: string[] = []; // promise.push
                zip.loadAsync(content, {base64: true}).then((unzipped) => {
                    // now have every files contained in content
                    unzipped.folder("courses").forEach((relativePath, file) => {
                        promises.push(file.async("text"));
                    });
                    Promise.all(promises).then((datafile) => {
                        let oneDataset: InsightSection[] = storeStructure(datafile, id); // store into InsightSection
                        // check if the dataset has valid section
                        if (oneDataset.length === 0) {
                            reject(new InsightError("no valid section; invalid dataset"));
                        } else {
                            // Add it to Memory and the Dataset list
                            this.datasetMap.set(id, oneDataset);
                            const newDataset: InsightDataset = {id: id, kind: kind, numRows: oneDataset.length};
                            this.dataSetList.push(newDataset);
                            // save to disk
                            try {
                                let dest = path.join("data", id);
                                if (!fs.existsSync(dest)) {
                                    fs.createFileSync(dest);
                                }
                                fs.writeFileSync(dest, JSON.stringify(oneDataset));
                            } catch {
                                reject(new InsightError("fail write to disk"));
                            }
                            for (let ds of this.dataSetList) {
                                names.push(ds.id);
                            }
                            resolve(names);
                        }
                    }).catch((err: any) => reject(new InsightError("fail to read all files")));
                }).catch((err: any) => reject(new InsightError("invalid zip file")));
            }
        });
    }

    public removeDataset(id: string): Promise<string> {
        if (isInvalidString(id)) {
            return Promise.reject(new InsightError());
        }
        if (id.includes("_")) {
            return Promise.reject(new InsightError("invalid input id"));
        }
        // Loads from Disk
        loadDisk(this);
        // throw error if id doesnt exist
        if (!idExists(id, this.dataSetList)) {
            return Promise.reject(new NotFoundError());
        }
        // removes dataset from list
        for (let i = 0; i < this.dataSetList.length; i++) {
            if (this.dataSetList[i].id === id) {
                this.dataSetList.splice(i, 1);
                break;
            }
        }
        // removes it from memory
        this.datasetMap.delete(id);
        // Removes it from Disk
        let diskPath = "./data/" + id;
        if (fs.existsSync(diskPath)) {
            fs.unlinkSync(diskPath);
        }

        return Promise.resolve(id);
    }

    public performQuery(query: any): Promise <any[]> {
        // Loads from Disk;
        loadDisk(this);
        return new Promise<any[]>((resolve, reject) => {
            if (!isValidQuery(query)) {
                reject(new InsightError("Not Valid Query Format"));
            }
            if (this.dataSetList.length === 0) {
                reject(new InsightError("No DataSets to query"));
            }
            let whereFilter = query.WHERE;
            let options = query.OPTIONS;
            let column = options.COLUMNS;
            let order = options.ORDER;
            let id = column[0].split("_")[0];
            let queryData: any[];
            let trans = query.TRANSFORMATIONS;
            // load data from memory
            if (this.datasetMap.has(id)) {
                queryData = this.datasetMap.get(id);
            } else {
                reject(new InsightError("dataset not found"));
            }
            let datasetKind = getKind(this.dataSetList, id);
            let result: any[];
            try {
                result = Partition(whereFilter, queryData, id, queryData, datasetKind);
            } catch (e) {
                reject(new InsightError(e.message));
            }
            if (result.length !== 0) {
                result = getColumn(result, column, datasetKind, trans);
            }
            if (order) {
                orderSort(result, order, datasetKind);
            }
            if (result.length > 5000) {
                reject(new InsightError("Too many rows"));
            }
            resolve(result);
        });
    }

    public listDatasets(): Promise<InsightDataset[]> {
        loadDisk(this);
        return Promise.resolve(this.dataSetList);
    }
}

function storeStructure(data: any, datasetid: string): InsightSection[] {
    let listSec: InsightSection[] = [];
    let dataFiles: string[] = [];
    for (let item of data) {
        if (IsValidJSON(item)) {
            dataFiles.push(item);
        }
    }
    const oneDataset = dataFiles.map(function (file: string) {
        return JSON.parse(file);
    });
    for (let oneCourse of oneDataset) {
        // check valid section
        let coursearray: any = oneCourse.result;
        for (let oneSec of coursearray) {
            if (checkValidSection(oneSec)) {
                let dept: string = oneSec.Subject;
                let id: string = oneSec.Course;
                let avg: number = oneSec.Avg;
                let instructor: string  = oneSec.Professor;
                let title: string = oneSec.Title;
                let pass: number = oneSec.Pass;
                let fail: number = oneSec.Fail;
                let audit: number = oneSec.Audit;
                let uuid: string = oneSec.id.toString();
                let year: number = 1900;
                if (oneSec.Section !== "overall") {
                    year = oneSec.Year;
                }
                const oneSection: InsightSection = {courses_dept: dept,
                    courses_id: id,
                    courses_avg: avg,
                    courses_instructor: instructor,
                    courses_title: title,
                    courses_pass: pass,
                    courses_fail: fail,
                    courses_audit: audit,
                    courses_uuid: uuid,
                    courses_year: year};
                listSec.push(oneSection);
            }
        }
    }
    return listSec;
}
// check if the section has all required fields

function checkValidSection(oneSec: any): boolean {
    return oneSec.hasOwnProperty("Subject") && oneSec.hasOwnProperty("Course")
        && oneSec.hasOwnProperty("Avg") && oneSec.hasOwnProperty("Professor")
        && oneSec.hasOwnProperty("Title") && oneSec.hasOwnProperty("Pass")
        && oneSec.hasOwnProperty("Fail") && oneSec.hasOwnProperty("Audit")
        && oneSec.hasOwnProperty("id") && oneSec.hasOwnProperty("Year");
}
