import Server from "../src/rest/Server";

import InsightFacade from "../src/controller/InsightFacade";
import chai = require("chai");
import chaiHttp = require("chai-http");
import Log from "../src/Util";
import Response = ChaiHttp.Response;
import {expect} from "chai";
import Scheduler from "../src/scheduler/Scheduler";
import {SchedRoom, SchedSection} from "../src/scheduler/IScheduler";
let fs = require("fs-extra");

describe("Scheduler Test", function () {


    chai.use(chaiHttp);

    before(function () {
        Log.trace("In before");
    });

    after(function () {
        Log.trace("in After");
    });

    beforeEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.trace("In Before Each");
    });

    afterEach(function () {
        // might want to add some process logging here to keep track of what"s going on
        Log.trace("In After Each");
    });

    it("Schedule test 1", function () {
        try {
            let sections: SchedSection[] = [
                {courses_dept: "cpsc",
                    courses_id: "340",
                    courses_uuid: "1319",
                    courses_pass: 101,
                    courses_fail: 7,
                    courses_audit: 2
                },
                {
                    courses_dept: "cpsc",
                    courses_id: "340",
                    courses_uuid: "3397",
                    courses_pass: 171,
                    courses_fail: 3,
                    courses_audit: 1
                }
            ];
            let rooms: SchedRoom[] = [
                {
                    rooms_shortname: "AERL",
                    rooms_number: "120",
                    rooms_seats: 144,
                    rooms_lat: 49.26372,
                    rooms_lon: -123.25099
                },
                {
                    rooms_shortname: "ALRD",
                    rooms_number: "105",
                    rooms_seats: 94,
                    rooms_lat: 49.2699,
                    rooms_lon: -123.25318
                }
            ];
            let schedule: Scheduler = new Scheduler();
            let result = schedule.schedule(sections, rooms);
            Log.trace(result);
        } catch (err) {
            expect.fail();
        }
    });

    it("Schedule test 2", function () {
        try {
            let sections: SchedSection[] = [
                {courses_dept: "cpsc",
                    courses_id: "340",
                    courses_uuid: "1319",
                    courses_pass: 101,
                    courses_fail: 7,
                    courses_audit: 2
                },
                {
                    courses_dept: "cpsc",
                    courses_id: "340",
                    courses_uuid: "3397",
                    courses_pass: 50,
                    courses_fail: 3,
                    courses_audit: 1
                }
            ];
            let rooms: SchedRoom[] = [
                {
                    rooms_shortname: "AERL",
                    rooms_number: "120",
                    rooms_seats: 144,
                    rooms_lat: 49.26372,
                    rooms_lon: -123.25099
                },
                {
                    rooms_shortname: "ALRD",
                    rooms_number: "105",
                    rooms_seats: 94,
                    rooms_lat: 49.2699,
                    rooms_lon: -123.25318
                }
            ];
            let schedule: Scheduler = new Scheduler();
            let result = schedule.schedule(sections, rooms);
            Log.trace(result);
        } catch (err) {
            expect.fail();
        }
    });

});
