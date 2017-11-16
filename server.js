var http = require('http');
var fs = require('fs');
var url = require('url');
var https = require('https');
var google = require('googleapis');
var compute = google.compute('v1');

// Read project instance from config file
var config = JSON.parse(fs.readFileSync("config.json"));
const PROJECT_ID = config.project;
const ZONE = config.zone;
const INSTANCE = config.instance;

// Define server behavior
const PORT = 8001;
const POLL_INTERVAL_MS = 2*1000;
const HOW_LONG_TO_POLL_FOR_MS = 2*60*1000;

console.log("Server Started");

// Google Cloud Platform Authentication for API calls requires an environmental
// variable that points to the file containing auth credentials
process.env['GOOGLE_APPLICATION_CREDENTIALS'] = __dirname + '/cred.json';

var vmStatus = "UNKNOWN";
var lastAccessTimestamp = 0;
var ongoingAction = "";

getStatus(updateStatus);
initiateStatusPolling();
http.createServer(function(request, response) {
    var path = url.parse(request.url).pathname;
    log("Incoming",path + "\t" + request.connection.remoteAddress);
    if (request.method == "GET") {
        if (path == "/status") {
            response.writeHead(200, {
                "Content-Type": "text/plain"
            });
            response.end(vmStatus);
        } else if (path == "/") {
            lastAccessTimestamp = new Date().getTime();
            fs.readFile('index.html', function(err, file) {
                response.writeHead(200, {
                    "Content-Type": "text/html"
                });
                getStatus(function(status) {
                    updateStatus(status);
                    response.end(file, "utf-8");
                });
            });
        } else {
            response.writeHead(404, {
                "Content-Type": "text/plain"
            });
            response.end("404 - not found");
            log("404",path);
        }
    } else if (request.method == "POST") {
        if(ongoingAction != "") {
            log("Reject", path);
            response.end("ongoing operation");
        } else if (path == "/on") {
            enableServer();
            response.end("success");
        } else if (path == "/off") {
            disableServer();
            response.end("success");
        } 
    }
}).listen(PORT);

function updateStatus(status) {
    log('Outgoing', status);
    vmStatus = status;
    if(ongoingAction == "enable" && status == "RUNNING") {
        ongoingAction = "";
    } else if (ongoingAction == "disable" && status == "TERMINATED") {
        ongoingAction = "";
    }
}

function initiateStatusPolling() {
    var timeSinceLastAccess = new Date().getTime() - lastAccessTimestamp;
    if (timeSinceLastAccess <= HOW_LONG_TO_POLL_FOR_MS) {
        setTimeout(function() {
            getStatus(updateStatus);
        }, POLL_INTERVAL_MS);
    }
    setTimeout(initiateStatusPolling, POLL_INTERVAL_MS);
}

/**
 * API call to get the status of the project instance
 */
function getStatus(callback) {
    authorize(function(authClient) {
        var request = {
            project: PROJECT_ID,
            zone: ZONE,
            instance: INSTANCE,
            auth: authClient,
        };
        compute.instances.get(request, function(err, response) {
            if (err) {
                console.error(err);
                //callback("UNKNOWN -- ERROR GETTING STATUS FROM GCP");
                callback(vmStatus);
                return;
            }
            callback(response.status);
        });
    });
}

/**
 * API call to start the project instance
 */
function enableServer() {
    ongoingAction = "enable";
    lastAccessTimestamp = new Date().getTime();
    authorize(function(authClient) {
        var request = {
            project: PROJECT_ID,
            zone: ZONE,
            instance: INSTANCE,
            auth: authClient,
        };
        compute.instances.start(request, function(err, response) {
            if (err) {
                console.error(err);
                return;
            }
            log("Start","Server enable request sent");
        });
    });
}

/**
 * API call to stop the project instance
 */
function disableServer() {
    ongoingAction = "disable";
    lastAccessTimestamp = new Date().getTime();
    authorize(function(authClient) {
        var request = {
            project: PROJECT_ID,
            zone: ZONE,
            instance: INSTANCE,
            auth: authClient,
        };
        compute.instances.stop(request, function(err, response) {
            if (err) {
                console.error(err);
                return;
            }
            log("Stop","Server disable request sent");
        });
    });
}

/**
 * Get authentication data to prepare for API call into Google Cloud Platform
 */
function authorize(callback) {
    google.auth.getApplicationDefault(function(err, authClient) {
        if (err) {
            console.error('authentication failed: ', err);
            return;
        }
        if (authClient.createScopedRequired && authClient.createScopedRequired()) {
            var scopes = ['https://www.googleapis.com/auth/cloud-platform'];
            authClient = authClient.createScoped(scopes);
        }
        callback(authClient);
    });
}

function log(type,message) {
    console.log(new Date().getTime() + "\t" + type + "\t" + message); // TODO: add IP or some other identifier and timestamp
}