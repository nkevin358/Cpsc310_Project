import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // Reference any datasets you've added to test/data here and they will
    // automatically be loaded in the 'before' hook.
    const datasetsToLoad: { [id: string]: string } = {
        courses: "./test/data/courses.zip",
        oneValidSection: "./test/data/oneValidSection.zip",
        multiValidSection: "./test/data/multiValidSection.zip",
        validAndInvalid: "./test/data/validAndInvalid.zip",
        noValidSection: "./test/data/noValidSection.zip",
        noFiles: "./test/data/noFiles.zip",
        wrongFormat: "./test/data/wrongFormat.zip",
        wrongName: "./test/data/wrongName.zip",
        cour__se: "./test/data/cour__se.zip",
        noAudit: "./test/data/noAudit.zip",
        noAvg: "./test/data/noAvg.zip",
        noCourse: "./test/data/noCourse.zip",
        noFail: "./test/data/noFail.zip",
        noPass: "./test/data/noPass.zip",
        noProfessor: "./test/data/noProfessor.zip",
        noSubject: "./test/data/noSubject.zip",
        notitle: "./test/data/notitle.zip",
        noUUID: "./test/data/noUUID.zip",
        noYear: "./test/data/noYear.zip",
        notJSON: "./test/data/notJSON.zip",
        rooms: "./test/data/rooms.zip",
    };
    let datasets: { [id: string]: string } = {};
    let insightFacade: InsightFacade;
    const cacheDir = __dirname + "/../data";

    before(function () {
        // This section runs once and loads all datasets specified in the datasetsToLoad object
        // into the datasets object
        Log.test(`Before all`);
        for (const id of Object.keys(datasetsToLoad)) {
            datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
        }
    });

    beforeEach(function () {
        // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
        // This runs before each test, which should make each test independent from the previous one
        Log.test(`BeforeTest: ${this.currentTest.title}`);
        try {
            fs.removeSync(cacheDir);
            fs.mkdirSync(cacheDir);
            insightFacade = new InsightFacade();
        } catch (err) {
            Log.error(err);
        }
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // D2: addDataset type room
    it("add Room", function () {
        this.timeout(15000);
        const id: string = "rooms";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });
    });

    // This is a unit test. You should create more like this!
    it("Should add a valid dataset", function () {
        this.timeout(15000);
        const id: string = "courses";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });
    // Sept. 10: testing cases to addDataset, removeDataset, listDataset  Q: list of dataset; independent dataset; merge
    // 1. add a dataset of only one valid section
    it("Should add one valid section dataset", function () {
        const id: string = "oneValidSection";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });
    // 2. add a dataset of only one valid course w. multiple sections
    it("Should add a course with multiple sections", function () {
        const id: string = "multiValidSection";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });
    // 3. add a dataset has an invalid course and a valid course
    it("Should add a dataset has an invalid course and a valid course", function () {
        const id: string = "validAndInvalid";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });
    // 4. failed add a dataset with no valid section
    it("fail to add dataset w. no valid section", function () {
        const id: string = "noValidSection";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });
    // 5. failed add a dataset with no files
    it("fail to add dataset w. no files", function () {
        const id: string = "noFiles";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });
    // 6. failed wrong JSON format
    it("failed wrong JSON format", function () {
        const id: string = "wrongFormat";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });
    it("failed w. no JSON file", function () {
        const id: string = "notJSON";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });
    // 7. wrong folder name
    it("failed wrong folder name", function () {
        const id: string = "wrongName";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });
    // 8. failed add twice dataset w. same id
    it("added twice dataset w. same id", function () {
        const id: string = "oneValidSection";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses);
        }).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });
    // 9. failed since wrong dataset id
    it("failed w. wrong dataset id", function () {
        const id: string = "cour__se";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("failed w. no Audit of a section", function () {
        const id: string = "noAudit";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("failed w. no Avg of a section", function () {
        const id: string = "noAvg";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("failed w. no dept of a section", function () {
        const id: string = "noCourse";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("failed w. no Fail of a section", function () {
        const id: string = "noFail";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("failed w. no pass of a section", function () {
        const id: string = "noPass";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("failed w. no Professor of a section", function () {
        const id: string = "noProfessor";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("failed w. no Subject of a section", function () {
        const id: string = "noSubject";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });
    it("failed w. no title of a section", function () {
        const id: string = "notitle";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });
    it("failed w. no UUID of a section", function () {
        const id: string = "noUUID";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });
    it("failed w. no year of a section", function () {
        const id: string = "noYear";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("failed w. empty id", function () {
        const id: string = "";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    // 10. remove a dataset success
    it("remove dataset success", function () {
        const id: string = "oneValidSection";
        const expected: string = id;
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.removeDataset(id);
        }).then((result: string) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

    // 11. failed w. not found id
    it("fail with not found id", function () {
        const id: string = "notfoundyet";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, NotFoundError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(NotFoundError, "invalid");
        });

    });

    // 13. failed w. invalid id blank
    it("fail with blank", function () {
        const id: string = "  ";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("remove fail with invalid id", function () {
        const id: string = "Cour__ses";
        const expected: string[] = [id];
        return insightFacade.removeDataset(id).then((result: string) => {
            expect.fail(result, InsightError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(InsightError, "invalid");
        });

    });

    it("add a dataset irrelevant to remove", function () {
        const id: string = "courses";
        const removeid: string = "oneValidSection";
        const expected: string[] = [id];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.removeDataset(removeid);
        }).then((result: string) => {
            expect.fail(result, NotFoundError, "Should have rejected");
        }).catch((err: any) => {
            expect(err).to.be.instanceOf(NotFoundError, "invalid");
        });

    });

    it("list dataset", function () {
        const id: string = "courses";
        const set1: InsightDataset = {id: "courses", kind: InsightDatasetKind.Courses, numRows: 64612};
        const expected: InsightDataset[] = [set1];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.listDatasets();
        }).then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });

/*    it("list dataset empty", function () {
        const id: string = "";
        const expected: InsightDataset[] = [];
        return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then(() => {
            return insightFacade.listDatasets();
        }).then((result: InsightDataset[]) => {
            expect(result).to.deep.equal(expected);
        }).catch((err: any) => {
            expect.fail(err, expected, "Should not have rejected");
        });

    });*/

});

// adding malformed course file/ EBNF explanation/ Red files

/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    const datasetsToQuery: { [id: string]: any } = {
        courses: {id: "courses", path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
        rooms: {id: "rooms", path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms}
    };
    let insightFacade: InsightFacade = new InsightFacade();
    let testQueries: ITestQuery[] = [];

    // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    before(function () {
        Log.test(`Before: ${this.test.parent.title}`);

        // Load the query JSON files under test/queries.
        // Fail if there is a problem reading ANY query.
        try {
            testQueries = TestUtil.readTestQueries();
        } catch (err) {
            expect.fail("", "", `Failed to read one or more test queries. ${err}`);
        }

        // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
        // Will fail* if there is a problem reading ANY dataset.
        const loadDatasetPromises: Array<Promise<string[]>> = [];
        for (const key of Object.keys(datasetsToQuery)) {
            const ds = datasetsToQuery[key];
            const data = fs.readFileSync(ds.path).toString("base64");
            loadDatasetPromises.push(insightFacade.addDataset(ds.id, data, ds.kind));
            Log.trace(insightFacade.dataSetList);
            Log.trace(insightFacade.datasetMap);
        }
        return Promise.all(loadDatasetPromises).catch((err) => {
            /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
             * for the purposes of seeing all your tests run.
             * For D1, remove this catch block (but keep the Promise.all)
             */
            return Promise.resolve("HACK TO LET QUERIES RUN");
        });
    });

    beforeEach(function () {
        Log.test(`BeforeTest: ${this.currentTest.title}`);
    });

    after(function () {
        Log.test(`After: ${this.test.parent.title}`);
    });

    afterEach(function () {
        Log.test(`AfterTest: ${this.currentTest.title}`);
    });

    // Dynamically create and run a test for each query in testQueries
    // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    it("Should run test queries", function () {
        describe("Dynamic InsightFacade PerformQuery tests", function () {
            for (const test of testQueries) {
                it(`[${test.filename}] ${test.title}`, function (done) {
                    insightFacade.performQuery(test.query).then((result) => {
                        TestUtil.checkQueryResult(test, result, done);
                    }).catch((err) => {
                        TestUtil.checkQueryResult(test, err, done);
                    });
                });
            }
        });
    });
});
