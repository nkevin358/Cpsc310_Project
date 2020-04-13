/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
CampusExplorer.sendQuery = function(query) {
    return new Promise(function(fulfill, reject) {
        let xhr = new XMLHttpRequest();
        let baseurl = "http://localhost:4321/query";
        xhr.open("POST",baseurl,true);
        xhr.onload = () => {
            fulfill(xhr.response);
        };
        xhr.send(JSON.stringify(query));
    });
};
