import InsightFacade from "../controller/InsightFacade";
import restify = require("restify");
import Log from "../Util";
import {InsightError, NotFoundError} from "../controller/IInsightFacade";
let connection = new InsightFacade();

export default {
    putDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("putDataset Running");
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            let id = req.params.id;
            let kind = req.params.kind;
            let zip = req.body.toString("base64");
            connection.addDataset(id, zip, kind).then((result: any) => {
                let response = {result: result};
                res.json(200, response);
            }).catch((err: any) => {
                Log.error("Server::echo(..) - responding 400");
                res.json(400, {error: err.message});
            });
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err.message});
        }
        return next();
    },
    deleteDataset(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("deleteDataset Running");
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        let status = 0;
        try {
            let id: string = req.params.id;
            Log.trace(id);
            connection.removeDataset(id).then((result: any) => {
                let response = {result: result};
                res.json(200, response);
            }).catch((err: any) => {
                if (err instanceof NotFoundError) {
                    status = 404;
                } else {
                    status = 400;
                }
                res.json(status, {error: err.message});
            });
        } catch (err) {
            res.json(400, {error: err.message});
        }
        return next();
    },
    postQuery(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("postQuery Running");
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            let query = req.body;
            Log.trace(query);
            connection.performQuery(query).then((result: any) => {
                let response = {result: result};
                res.json(200, response);
            }).catch((err: any) => {
                let response = {error: err.message};
                res.json(400, response);
            });
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            res.json(400, {error: err.message});
        }
        return next();
    },
    getDatasets(req: restify.Request, res: restify.Response, next: restify.Next) {
        Log.trace("getDatasets Running");
        Log.trace("Server::echo(..) - params: " + JSON.stringify(req.params));
        try {
            connection.listDatasets().then((result: any) => {
                let response = {result: result};
                res.json(200, response);
            }).catch((err: any) => {
                let response = {error: err.message};
                res.json(400, response);
            });
        } catch (err) {
            Log.error("Server::echo(..) - responding 400");
            let response = {error: err.message};
            res.json(400, response);
        }
        return next();
    }
};


