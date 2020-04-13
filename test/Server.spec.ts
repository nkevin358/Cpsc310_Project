import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Log from "../src/Util";
import Response = ChaiHttp.Response;
import {expect} from "chai";
let fs = require("fs-extra");

describe("Facade D3", function () {

    let facade: InsightFacade = null;
    let server: Server = null;
    let URL = "http://127.0.0.1:4321";

    chai.use(chaiHttp);

    before(function () {
        facade = new InsightFacade();
        server = new Server(4321);
        // TODO: start server here once and handle errors properly
        server.start();
    });

    after(function () {
        server.stop();
        // TODO: stop server here once!
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.trace("In Before Each");
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.trace("In After Each");
    });

    it("PUT test for courses dataset Pass", function () {
        try {
            return chai.request(URL)
                .put("/dataset/courses/courses")
                .send(fs.readFileSync("./test/data/courses.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("Inside Then Block");
                    Log.trace(res.body.result);
                    expect(res.status).to.be.equal(200);
                    return chai.request(URL)
                        .get("/datasets")
                        .then((result: Response) => {
                            Log.trace(result.body.result);
                        });
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail("Should have added properly");
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("PUT test for Disk read in dataset Pass", function () {
        try {
            return chai.request(URL)
                .put("/dataset/oneValidSection/courses")
                .send(fs.readFileSync("./test/data/oneValidSection.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    Log.trace("Inside Then Block");
                    Log.trace(res.body.result);
                    expect(res.status).to.be.equal(200);
                    return chai.request(URL)
                        .get("/datasets")
                        .then((result: Response) => {
                            Log.trace(result.body.result);
                        });
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail("Should have added properly");
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("PUT test for Multiple datasets Pass", function () {
        try {
            return chai.request(URL)
                .put("/dataset/courses/courses")
                .send(fs.readFileSync("./test/data/courses.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    return chai.request(URL)
                        .put("/dataset/oneValidSection/courses")
                        .send(fs.readFileSync("./test/data/oneValidSection.zip"))
                        .set("Content-Type", "application/x-zip-compressed")
                        .then((result: Response) => {
                            Log.trace(result.body.result);
                        });
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail("Should have added properly");
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("POST test for datasets Pass", function () {
        try {
            let query = {
                WHERE: {
                    GT: {
                        courses_avg: 99
                    }
                },
                OPTIONS: {
                    COLUMNS: [
                        "courses_dept",
                        "courses_avg"
                    ],
                    ORDER: "courses_avg"
                }
            };
            return chai.request(URL)
                .put("/dataset/courses/courses")
                .send(fs.readFileSync("./test/data/courses.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    return chai.request(URL)
                        .post("/query")
                        .send(query)
                        .then((result: Response) => {
                            Log.trace(result.body.result);
                        });
                })
                .catch(function (err) {
                    // some logging here please!
                    expect.fail("Should have added properly");
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("PUT test for Invalid dataset Fail", function () {
        try {
            return chai.request(URL)
                .put("/dataset/noValidSection/courses")
                .send(fs.readFileSync("./test/noValidSection/courses.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail("Should not have added invalid");
                })
                .catch(function (err) {
                    // some logging here please!
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("DEL test for courses dataset Fail", function () {
        try {
            return chai.request(URL)
                .del("/dataset/courses")
                .then(function (res: Response) {
                    Log.trace("Inside Then Block");
                    Log.trace(res.body.result);
                    expect.fail();
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("failed properly");
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Get Datasets test Pass", function () {
        try {
            return chai.request(URL)
                .get("/datasets")
                .then(function (res: Response) {
                    Log.trace("Inside Then Block");
                    Log.trace(res.body.result);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("Should not have failed");
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Get Echo test Pass", function () {
        try {
            return chai.request(URL)
                .get("/echo/echotest")
                .then(function (res: Response) {
                    Log.trace("Inside Then Block");
                    Log.trace(res.body.result);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("Should not have failed");
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("Get Static Test Pass", function () {
        try {
            return chai.request(URL)
                .get("/")
                .then(function (res: Response) {
                    Log.trace("Inside Then Block");
                    Log.trace(res.body.result);
                    expect(res.status).to.be.equal(200);
                })
                .catch(function (err) {
                    // some logging here please!
                    Log.trace("Should not have failed");
                    expect.fail();
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    it("PUT test for wrongName dataset Fail", function () {
        try {
            return chai.request(URL)
                .put("/dataset/wrongName/courses")
                .send(fs.readFileSync("./test/data/wrongName.zip"))
                .set("Content-Type", "application/x-zip-compressed")
                .then(function (res: Response) {
                    expect.fail("should have failed");
                })
                .catch(function (err) {
                    Log.trace("Inside Catch");
                    Log.trace(err.status);
                    expect(err.status).to.be.equal(400);
                });
        } catch (err) {
            // and some more logging here!
        }
    });

    // The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
    // Resubmit
});
