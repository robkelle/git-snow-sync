// CREATED BY: ROBERT KELLER
// DATE: 01/12/2018

/*
    DESCRIPTION: Syncs with Github repository and automatically imports update sets
    VERSION: 0.0.2
*/

// CONSTANTS
const GIT_USER_NAME = '';
const GIT_REPO_NAME = '';
const TOKEN = '';
const FOLDER_NAME = '';
const URI = 'https://api.github.com/repos/' + GIT_USER_NAME + '/' + GIT_REPO_NAME + '/contents/' + FOLDER_NAME + '/';
const DEBUGGER = true; // Set to false to turn off debugging
const INSERT_SWITCH = false; // Set to true to turn on script functionality

// FUNCTIONS
function logMessage(message) {
    if (DEBUGGER) {
        return ("<(^_^)>" + " :::<br>" + message);
    }
}

function escapeRegularExpression(payload) {
    return payload.replace('<?xml version="1.0" encoding="UTF-8"?><?xml version="1.0" encoding="UTF-8"?>', '<?xml version="1.0" encoding="UTF-8"?>');
}

function restApiCall(URI) {
    var getHttpReponse, executeResponse, httpResponseStatus, results;
    getHttpReponse = new sn_ws.RESTMessageV2();
    getHttpReponse.setHttpMethod('GET');
    getHttpReponse.setEndpoint(URI);
    getHttpReponse.setRequestHeader('Authorization', 'Bearer ' + TOKEN);
    executeResponse = getHttpReponse.execute();
    httpResponseStatus = executeResponse.getStatusCode();
    gitApiResponse = executeResponse.getBody();
    return JSON.parse(gitApiResponse);
}

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0,
            v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// GLOBAL VARIABLES
var fileData = [];
var results = restApiCall(URI);
var rowCountTotal = 0;
var guid = uuidv4();

// MAIN
try {
    for (var a = 0; a < results.length; a++) {
        // Name of GitHub file name within FOLDER_NAME constant
        var rowCountPerUpdateSet = 0;
        var base64Content = restApiCall(URI + results[a].name);
        var xml = GlideStringUtil.base64Decode(base64Content.content);
        var i = 1;
        var xmldoc = new XMLDocument(xml);
        var sysID = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/sys_id");
        var sysRemoteUpdateSet = new GlideRecord('sys_remote_update_set');
        sysRemoteUpdateSet.initialize();

        // Reads raw data from XML node sys_remote_update_set and creates the retrieved update set
        var ruApplication = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/application");
        var ruApplicationName = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/application_name");
        var ruApplicationScope = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/application_scope");
        var ruName = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/name");
        var ruRemoteSysId = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/remote_sys_id");
        var ruState = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/state");
        var ruSysClassName = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/sys_class_name");
        var ruSysCreatedBy = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/sys_created_by");
        var ruSysCreatedOn = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/sys_created_on");
        var ruSysId = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/sys_id");
        var ruSysModCount = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/sys_mod_count");
        var ruSysUpdatedBy = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/sys_updated_by");
        var ruSysUpdatedOn = xmldoc.getNodeText("//unload/sys_remote_update_set[" + i + "]/sys_updated_on");

        if (ruRemoteSysId != null) {

            // Insert remote update sets into the retrieved update set table
            if (INSERT_SWITCH) {
                sysRemoteUpdateSet.application = ruApplicationName;
                sysRemoteUpdateSet.application_name = ruApplicationName;
                sysRemoteUpdateSet.application_scope = ruApplicationScope;
                sysRemoteUpdateSet.description = guid; // Unique identifier to keep track of retrieved update sets
                sysRemoteUpdateSet.name = ruName;
                sysRemoteUpdateSet.remote_sys_id = ruRemoteSysId;
                sysRemoteUpdateSet.state = ruState;
                sysRemoteUpdateSet.sys_class_name = ruSysClassName;
                sysRemoteUpdateSet.sys_created_by = ruSysCreatedBy;
                sysRemoteUpdateSet.sys_created_on = ruSysCreatedOn;
                sysRemoteUpdateSet.setNewGuidValue(ruSysId);
                sysRemoteUpdateSet.sys_mod_count = ruSysModCount;
                sysRemoteUpdateSet.sys_updated_by = ruSysUpdatedBy;
                sysRemoteUpdateSet.sys_updated_on = ruSysUpdatedOn;
                sysRemoteUpdateSet.insert();
            }

            gs.info(logMessage(
                "<b>status:</b> " + "<span style='color:green'>Success</span>" + "<br>" +
                "<b>application:</b> " + ruApplication + "<br>" +
                "<b>application_name:</b> " + ruApplicationName + "<br>" +
                "<b>application_scope:</b> " + ruApplicationScope + "<br>" +
                "<b>description:</b> " + guid + "<br>" +
                "<b>name:</b> " + ruName + "<br>" +
                "<b>remote_sys_id:</b> " + ruRemoteSysId + "<br>" +
                "<b>state:</b> " + ruState + "<br>" +
                "<b>sys_class_name:</b> " + ruSysClassName + "<br>" +
                "<b>sys_created_by:</b> " + ruSysCreatedBy + "<br>" +
                "<b>sys_created_on:</b> " + ruSysCreatedOn + "<br>" +
                "<b>sys_id:</b> " + ruSysId + "<br>" +
                "<b>sys_mod_count:</b> " + ruSysModCount + "<br>" +
                "<b>sys_updated_by:</b> " + ruSysModCount + "<br>" +
                "<b>sys_updated_by:</b> " + ruSysUpdatedBy + "<br>" +
                "<b>sys_updated_on:</b> " + ruSysUpdatedOn + "<br>"
            ));
        }

        // Loops through decoded XML file and creates customer updates linked to the imported update set
        while (sysID != null) {

            var updateXML = new GlideRecord('sys_update_xml');
            updateXML.initialize();

            // Reads raw data from XML node sys_update_xml
            var action = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/action");
            var application = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/application");
            var category = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/category");
            var name = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/name");
            var payload = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/payload");
            var remoteUpdateSet = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/remote_update_set");
            var replaceOnUpgrade = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/replace_on_upgrade");
            var createdBy = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/sys_created_by");
            var createdOn = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/sys_created_on");
            var sysID = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/sys_id");
            var sysModCount = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/sys_mod_count");
            var updatedBy = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/sys_updated_by");
            var updatedOn = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/sys_updated_on");
            var table = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/table");
            var targetName = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/target_name");
            var type = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/type");
            var updateDomain = xmldoc.getNodeText("//unload/sys_update_xml[" + i + "]/update_domain");

            // Add xml header to and function that filters out the first record that creates two headers
            payload = ('<?xml version="1.0" encoding="UTF-8"?>' + payload);
            var payloadFormatted = escapeRegularExpression(payload);

            // Inserts data into sys_update_xml table
            if (sysID == null) {} else {
                if (INSERT_SWITCH) {
                    updateXML.action = action;
                    updateXML.application = application;
                    updateXML.category = category;
                    updateXML.name = name;
                    updateXML.payload = payloadFormatted;
                    updateXML.remote_update_set = remoteUpdateSet;
                    updateXML.replace_on_upgrade = replaceOnUpgrade;
                    updateXML.sys_created_by = createdBy;
                    updateXML.sys_created_on = createdOn;
                    updateXML.sys_id = sysID;
                    updateXML.sys_mod_count = sysModCount;
                    updateXML.sys_updated_by = updatedBy;
                    updateXML.sys_updated_on = updatedOn;
                    updateXML.table = table;
                    updateXML.target_name = targetName;
                    updateXML.type = type;
                    updateXML.update_domain = updateDomain;
                    updateXML.insert();
                }

                gs.info(logMessage(
                    "<b>status:</b> " + "Success" + "<br>" +
                    "<b>row:</b> " + rowCountTotal + "<br>" +
                    "<b>unique_per_update_set:</b> " + rowCountPerUpdateSet + "<br>" +
                    "<b>sys_id:</b> " + sysID + "<br>" +
                    "<b>name:</b> " + name + "<br>" +
                    "<b>action:</b> " + action + "<br>" +
                    "<b>application:</b> " + application + "<br>" +
                    "<b>category:</b> " + category + "<br>" +
                    "<b>payload:</b> " + payload + "<br>" +
                    "<b>remote_update_set:</b> " + remoteUpdateSet + "<br>" +
                    "<b>replace_on_upgrade:</b> " + replaceOnUpgrade + "<br" +
                    "<b>sys_created_by:</b> " + createdBy + "<br>" +
                    "<b>sys_created_on:</b> " + createdOn + "<br>" +
                    "<b>sys_mod_count:</b> " + sysModCount + "<br>" +
                    "<b>sys_updated_by:</b> " + updatedBy + "<br>" +
                    "<b>sys_updated_on:</b> " + updatedOn + "<br>" +
                    "<b>table:</b> " + table + "<br>" +
                    "<b>target_name:</b> " + targetName + "<br>" +
                    "<b>type:</b> " + type + "<br>" +
                    "<b>update_domain:</b> " + updateDomain + "<br>"
                ));
            }

            i++;
            rowCountTotal++;
            rowCountPerUpdateSet++;
        }
    }
} catch (err) {
    // Ignoring null because of a java.lang.nullpointerexception error
    if (err.message == null) {} else {
        gs.info("<(^_^)>" + " --- " + err);
    }
}