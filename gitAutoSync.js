// CREATED BY: ROBERT KELLER
// DATE: 12/14/2017

/*
    DESCRIPTION:
    VERSION: 0.0.1
*/

// CONSTANTS
const TOKEN = '7386325e1cf75825b8d75d405ae4c5f140df908f';
const URI = 'https://api.github.com/repos/robkelle/git-snow-sync/contents/log/';
const FULL = 'Rob Keller'; // FULL NAME
const EMAIL = 'Rob.Keller@gmail.com'; // EMAIL

// GLOBAL VARIABLES
var sysidRetrieved, sysidLocal, grUpdateSet, grRetrievedUpdateSet, grScope, grUpdateXML, fileName, updateSetIds;

function uploadUpdateSetToGithub(sysidRetrieved, fileName) {
    var getHttpReponse, executeResponse, httpResponseStatus, results;
    getHttpReponse = new sn_ws.RESTMessageV2();
    getHttpReponse.setHttpMethod('GET');
    getHttpReponse.setEndpoint(URI + fileName);
    getHttpReponse.setRequestHeader('Authorization', 'Bearer ' + TOKEN);
    executeResponse = getHttpReponse.execute();
    httpResponseStatus = executeResponse.getStatusCode();
    gitApiResponse = executeResponse.getBody();
    results = JSON.parse(gitApiResponse);
    updateFile(TOKEN, fileName, GlideStringUtil.base64Encode(buildUpdateSetXML(sysidRetrieved).toString()), results.sha.toString());
}

function buildUpdateSetXML(sysidRetrieved) {
    var tempRetrievedUpdateSet, parentpdateSetXml, childUpdateSetXml, updateSetXml;
    tempRetrievedUpdateSet = new GlideRecord('sys_remote_update_set');
    tempRetrievedUpdateSet.get(sysidRetrieved);
    parentpdateSetXml = getXML(tempRetrievedUpdateSet);
    childUpdateSetXml = getChildUpdates(tempRetrievedUpdateSet.sys_id.toString());
    parentpdateSetXml = parentpdateSetXml.replace('<?xml version="1.0" encoding="UTF-8"?>', '<?xml version="1.0" encoding="UTF-8"?><unload unload_date="' + GlideSysDateUtil.getUMTDateTimeString() + '">');
    updateSetXml = parentpdateSetXml + childUpdateSetXml + '</unload>';
    return updateSetXml;
}

function getXML(record) {
    var xmlSerializer, xml;
    xmlSerializer = new GlideRecordXMLSerializer();
    xml = xmlSerializer.serialize(record);
    return xml;
}

function getSetRecords() {
    var setRecord, inProgressSets;
    setRecord = new GlideRecord('sys_update_set');
    setRecord.addEncodedQuery('state=in progress^name!=Default');
    setRecord.query();
    inProgressSets = [];

    while (setRecord.next()) {
        inProgressSets.push(setRecord.sys_id.toString());
    }

    return inProgressSets;
}

function updateFile(TOKEN, fileName, content, sha) {
    var body, getHttpReponse, message;
    try {
        body = {
            "message": fileName + " being updates/created.",
            "committer": {
                "name": FULL,
                "email": EMAIL
            },
            "content": content,
        };
        if (sha) {
            body.sha = sha;
        }
        getHttpReponse = new sn_ws.RESTMessageV2();
        getHttpReponse.setHttpMethod("PUT");
        getHttpReponse.setEndpoint(URI + fileName);
        getHttpReponse.setRequestHeader('Authorization', 'Bearer ' + TOKEN);
        getHttpReponse.setRequestBody(JSON.stringify(body));
        getHttpReponse.execute();
    } catch (error) {
        message = error.getMessage();
        gs.print(message);
    }
}

function getChildUpdates(parentSet) {
    var updatesXML, sysUpdates;
    sysUpdates = new GlideRecord('sys_update_xml');
    sysUpdates.query('remote_update_set', parentSet);
    while (sysUpdates.next()) {
        if (updatesXML) {
            updatesXML += getXML(sysUpdates).replace('<?xml version="1.0" encoding="UTF-8"?>', '');
        } else {
            updatesXML = getXML(sysUpdates).replace('<?xml version="1.0" encoding="UTF-8"?>', '');
        }
    }
    return updatesXML;
}

// MAIN
updateSetIds = getSetRecords();
for (updateSetId in updateSetIds) {
    sysidLocal = updateSetIds[updateSetId];
    grUpdateSet = new GlideRecord('sys_update_set');
    if (grUpdateSet.get(sysidLocal)) {
        grRetrievedUpdateSet = new GlideRecord('sys_remote_update_set');
        grRetrievedUpdateSet.initialize();
        grRetrievedUpdateSet.description = grUpdateSet.description;
        grRetrievedUpdateSet.name = grUpdateSet.name;
        grRetrievedUpdateSet.release_date = grUpdateSet.release_date;
        grRetrievedUpdateSet.remote_sys_id = grUpdateSet.sys_id;
        grRetrievedUpdateSet.application = grUpdateSet.application;
        grRetrievedUpdateSet.state = "loaded";
        grScope = new GlideRecord('sys_scope');
        grScope.get(grUpdateSet.application);

        if (grScope.isValid()) {
            grRetrievedUpdateSet.application_name = grScope.name;
            grRetrievedUpdateSet.application_scope = grScope.scope;
            grRetrievedUpdateSet.application_version = grScope.version;
        }

        if (sysidRetrieved = grRetrievedUpdateSet.insert()) {
            grUpdateXML = new GlideRecord('sys_update_xml');
            grUpdateXML.addQuery('update_set', sysidLocal);
            grUpdateXML.query();

            while (grUpdateXML.next()) {
                grUpdateXML.remote_update_set = sysidRetrieved;
                grUpdateXML.update_set = '';
                grUpdateXML.insert();
            }

            fileName = ((grUpdateSet.getValue('name') + '.xml').replace(/\s+/g, '_'));
            uploadUpdateSetToGithub(sysidRetrieved, fileName);
            grUpdateXML = new GlideRecord('sys_update_xml');
            grUpdateXML.addQuery('remote_update_set', sysidRetrieved);
            grUpdateXML.query();
            grUpdateXML.deleteMultiple();
            grRetrievedUpdateSet = new GlideRecord('sys_remote_update_set');
            grRetrievedUpdateSet.get(sysidRetrieved);
            grRetrievedUpdateSet.deleteRecord();
        }
    }
}