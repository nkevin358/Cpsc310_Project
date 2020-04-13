import {IScheduler, SchedRoom, SchedSection, TimeSlot} from "./IScheduler";

export default class Scheduler implements IScheduler {

    public schedule(sections: SchedSection[], rooms: SchedRoom[]): Array<[SchedRoom, SchedSection, TimeSlot]> {
        let sortedSchedSections: SchedSection[] =  sections.sort(function (a, b) {
            return (b.courses_audit + b.courses_fail + b.courses_pass) -
            (a.courses_audit + a.courses_fail + a.courses_pass);
        });
        let sortedRooms: SchedRoom[] =  rooms.sort(function (a, b) {
            return (b.rooms_seats) - (a.rooms_seats);
        });
        let result: any[] = [];
        while (sortedSchedSections.length > 0 && sortedRooms.length > 0) {
            let partitionStart = -1;
            for (let i = 0; i < sortedSchedSections.length; i++) {
                if (getSectionSize(sortedSchedSections[i]) <= getRoomCap(sortedRooms[0])) {
                    partitionStart = i;
                    break;
                }
            }
            // No Remaining sections fit in a room so leave loop
            if (partitionStart === -1) {
                break;
            } else {
                // Remove sections that do not fit in any room
                sortedSchedSections.splice(0, partitionStart);
            }
            // Section Partition of 15 TimeSlots or the remaining
            let sectionPartition: SchedSection[] = [];
            if (sortedSchedSections.length >= 15) {
                for (let i = 0; i < 15; i++) {
                    sectionPartition.push(sortedSchedSections[i]);
                }
                sortedSchedSections.splice(0, 15);
            } else {
                for (let item of sortedSchedSections) {
                    sectionPartition.push(item);
                }
                sortedSchedSections.splice(0, sortedSchedSections.length);
            }
            // Create schedule for Partition of sections
            let scheduledPartition = schedulePartition(sectionPartition, sortedRooms[0]);
            for (let item of scheduledPartition) {
                result.push(item);
            }
            sortedRooms.splice(0, 1);
        }
        return result;
    }
}
function getRoomCap(room: SchedRoom): number {
    return room.rooms_seats;
}
function getSectionSize(section: SchedSection): number {
    return section.courses_fail + section.courses_pass + section.courses_audit;
}
function schedulePartition(sections: SchedSection[], room: SchedRoom): any[] {
    let result: any[] = [];
    let timeslots: TimeSlot[] = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200", "MWF 1200-1300",
        "MWF 1300-1400", "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700",
        "TR  0800-0930", "TR  0930-1100", "TR  1100-1230", "TR  1230-1400",
        "TR  1400-1530", "TR  1530-1700"];
    for (let i = 0; i < sections.length; i++) {
        let addition = [room, sections[i], timeslots[i] ];
        result.push(addition);
    }
    return result;
}

