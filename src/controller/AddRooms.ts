import {InsightDataset, InsightDatasetKind, InsightError, InsightRoom} from "./IInsightFacade";
import http = require("http");
import * as path from "path";
let parse5 = require("parse5");
import JSZip = require("jszip");
let fs = require("fs-extra");

export function addNewRoomType(id: string, content: string, kind: InsightDatasetKind,
                               datasetMap: any, dataSetList: any) {
    return new Promise<string[]> ((resolve, reject) => {
    let properties: any[] = [];
    let listRooms: InsightRoom[] = [];
    let zip = new JSZip();
    zip.loadAsync(content, {base64: true}).then((unzipped) => {
        unzipped.folder("rooms").file("index.htm").async("text").then((datafile) => {
            let doc = parse5.parse(datafile);
            saveBuildingProperties(doc, properties);
            getGeoLocation(properties).then(() => {
                let promises: any[] = [];
                for (let p of properties) {
                    let pathRoom = "rooms/" + p.path.substring(2);
                    promises.push(zip.file(pathRoom).async("binarystring"));
                }
                Promise.all(promises).then((datafileRoom) => {
                    const parsedData = datafileRoom.map((file: string) =>  parse5.parse(file));
                    let count: number = 0, names: string[] = [];
                    for (let file of parsedData) {
                        let p = properties[count];
                        if (p.hasOwnProperty("lat") && p.hasOwnProperty("lon")) {
                            listRooms.concat(storeRoomStructure(file, p, listRooms));
                        }
                        count++;
                    }
                    if (listRooms.length === 0) {
                        reject("invalid room dataset");
                    }
                    datasetMap.set(id, listRooms);
                    const newDataset: InsightDataset = {id: id, kind: kind, numRows: listRooms.length};
                    dataSetList.push(newDataset);
                    try {
                        let dest = path.join("data", id);
                        if (!fs.existsSync(dest)) {
                            fs.createFileSync(dest);
                        }
                        fs.writeFileSync(dest, JSON.stringify(listRooms));
                    } catch {
                        reject(new InsightError("fail write to disk"));
                    }
                    for (let ds of dataSetList) {
                        names.push(ds.id);
                    }
                    resolve(names);
                });
            });
        }).catch((err: any) => reject(new InsightError("fail to read files")));
    }).catch((err: any) => reject(new InsightError("fail to unzip")));
});
}
export function saveBuildingProperties(parsedData: any, properties: any): any[] {
    // Promise.all to wait until all paths are saved in properties
    // check if it's a childNode itself
    if (parsedData.nodeName === "tbody") {
        let nodes = parsedData.childNodes;
        let trList = nodes.filter((r: any) => r.nodeName === "tr");
        for (let tr of trList) {
            let children = tr.childNodes;
            let tdList = children.filter((d: any) => d.nodeName === "td");
            let resultBuilding: any = {};
            for (let td of tdList) {
                let tdValue = td.attrs[0].value;
                // find returns the first element in the array satisfy nodeName === "a"
                let pathNode = td.childNodes.find((n: any) => n.nodeName === "a");
                let textNode = td.childNodes.find((n: any) => n.nodeName === "#text");
                getBuildingInfo(tdValue, pathNode, resultBuilding);
                if (tdValue.includes("building-code")) {
                    resultBuilding["shortname"] = textNode.value.trim();
                }
                if (tdValue.includes("building-address")) {
                    resultBuilding["address"] = textNode.value.trim();
                }
            }
            properties.push(resultBuilding);
        }

    } else if (parsedData.childNodes) { // check if the data for recursion
        for (let n of parsedData.childNodes) {
            saveBuildingProperties(n, properties);
        }
        // tbody must be an object
    }
    return properties;
}

export function getBuildingInfo(tdValue: any, pathNode: any, resultBuilding: any) {
    if (tdValue.includes("title")) {
        for (let attr of pathNode.attrs) {
            if (attr.name === "href") {
                resultBuilding["path"] = attr.value;
            }
        }
        resultBuilding["fullname"] = pathNode.childNodes[0].value.trim();
    }
}

export function storeRoomStructure(file: any, buildingP: any, listRoom: any[]): InsightRoom[] {
    if (file.nodeName === "tbody") {
        let nodes = file.childNodes;
        let trList = nodes.filter((r: any) => r.nodeName === "tr");
        let fullname = buildingP.fullname;
        let shortname = buildingP.shortname;
        let address = buildingP.address;
        let lat = buildingP.lat;
        let lon = buildingP.lon;
        for (let tr of trList) {
            let roomNum: string;
            let roomSeats: number;
            let furniture: string;
            let href: string;
            let type: string;
            let children = tr.childNodes;
            let tdList = children.filter((d: any) => d.nodeName === "td");
            for (let td of tdList) {
                let tdValue = td.attrs[0].value;
                // find returns the first element in the array satisfy nodeName === "a"
                let pathNode = td.childNodes.find((n: any) => n.nodeName === "a");
                let textNode = td.childNodes.find((n: any) => n.nodeName === "#text");
                getHref(tdValue, pathNode, href);
                if (tdValue.includes("room-number")) {
                    let tNode = pathNode.childNodes.find((n: any) => n.nodeName === "#text");
                    roomNum = tNode.value.trim();
                }
                if (tdValue.includes("room-capacity")) {
                    roomSeats = textNode.value.trim();
                }
                if (tdValue.includes("room-furniture")) {
                    furniture = textNode.value.trim();
                }
                if (tdValue.includes("room-type")) {
                    type = textNode.value.trim();
                }
            }
            let name = shortname + "_" + roomNum;
            listRoom.push(makeRoom(fullname, shortname, roomNum,
                name, address, lat, lon, Number(roomSeats), type, furniture, href));

        }
    } else if (file.childNodes) { // check if the data for recursion
        for (let n of file.childNodes) {
            listRoom.concat(storeRoomStructure(n, buildingP, listRoom));
        }
    }

    return listRoom;
}

export function makeRoom(fullname: string, shortname: string,
                         roomNum: string, name: string, address: string, lat: number,
                         lon: number, roomSeats: number, type: string,
                         furniture: string, href: string): InsightRoom {
    let seats = roomSeats;
    if (roomSeats === undefined || roomSeats === null) {
        seats = 0;
    }
    return {
        rooms_fullname: fullname,
        rooms_shortname: shortname,
        rooms_number: roomNum,
        rooms_name: name,
        rooms_address: address,
        rooms_lat: lat,
        rooms_lon: lon,
        rooms_seats: seats,
        rooms_type: type,
        rooms_furniture: furniture,
        rooms_href: href
    };

}

export function getHref(tdValue: any, pathNode: any, href: any) {
    if (tdValue.includes("field-nothing")) {
        for (let attr of pathNode.attrs) {
            if (attr.name === "href") {
                href = attr.value.trim();
            }
        }
    }
}


export function getGeoLocation(resultBuilding: any[]): any {
    let promises: any[] = [];
    resultBuilding.forEach((property: {[k: string]: any}) => {
        let address = property.address;
        let betweenChar = "%20";
        let addrString = address.split(" ").join(betweenChar);
        let urlString: string = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team026/" + addrString;
        let result = convertToPromise(urlString);
        promises.push(result);
        // return new Promise((resolve, reject) => {});
        // promises.push(http.get(urlString));
    });

    // let promises = urls.map(url => http.get(url));
    return Promise.all(promises).then((parseDatas: any) => {
        resultBuilding.forEach((oneBuilding: { [k: string]: any }, index) => {
            StoreGeoStructure(parseDatas[index], oneBuilding);

        });
    });
}

export function convertToPromise(url: any): Promise<any> {
    return new Promise<any>((resolve, reject) => {

        http.get(url, (res: any) => {
            if (res.statusCode === 200) {
                let parseData: any;
                res.on("data", (data: any) => {
                    parseData = JSON.parse(data);
                });
                res.on("end", () => {
                    resolve(parseData);
                }).on("error", (e: any) => {
                    reject(e);
                });
            } else {
                resolve({error : "fetch data failed"});
            }
        });
    });
}


export function StoreGeoStructure(parsedData: any, property: {[k: string]: any}) {
    // return new Promise((resolve, reject) => {parsedData = JSON.parse(data);
    if (!parsedData["error"]) {
        property["lat"] = parsedData["lat"];
        property["lon"] = parsedData["lon"];
    }
    // If a building does not elicit a valid geolocation, skip over it
}
