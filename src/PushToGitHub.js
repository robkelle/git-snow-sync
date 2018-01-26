// CREATED BY: ROBERT KELLER
// DATE: 12/14/2017

/*
    DESCRIPTION:
    VERSION: 0.0.2
*/

var date = {
    createDateObject: new Date(),
    today: function () {
        var MM = this.createDateObject.getMonth() + 1;
        var dd = this.createDateObject.getDate();
        var yy = this.createDateObject.getFullYear();
        var hh = this.createDateObject.getHours();
        var mm = this.createDateObject.getMinutes();
        var ss = this.createDateObject.getSeconds();

        return ('Y' + yy + '-M' + MM + '-D' + dd + '-T_' + hh + mm + ss);
    }
};

// GITHUB CONFIG
const GIT_USER_NAME = '';
const GIT_REPO_NAME = '';
const GIT_PATH_NAME = date.today();
const TOKEN = '';
const URI = 'https://api.github.com/repos/' + GIT_USER_NAME + '/' + GIT_REPO_NAME + '/contents/' + GIT_PATH_NAME + '/';
const FULL = '';
const EMAIL = '';

// DECLARING GLOBAL VARIABLES
var sysidRetrieved, sysidLocal, grUpdateSet, grRetrievedUpdateSet, grScope, grUpdateXML, fileName, updateSetIds;

var BackupUpdateSets = Class.create();
BackupUpdateSets.prototype = {
    uploadUpdateSetToGithub: function (sysidRetrieved, fileName) {
        var getHttpReponse, executeResponse, httpResponseStatus, results;
        getHttpReponse = new sn_ws.RESTMessageV2();
        getHttpReponse.setHttpMethod('GET');
        getHttpReponse.setEndpoint(URI + fileName);
        getHttpReponse.setRequestHeader('Authorization', 'Bearer ' + TOKEN);
        executeResponse = getHttpReponse.execute();
        httpResponseStatus = executeResponse.getStatusCode();
        gitApiResponse = executeResponse.getBody();
        results = JSON.parse(gitApiResponse);
        this.updateFile(TOKEN, fileName, GlideStringUtil.base64Encode(this.buildUpdateSetXML(sysidRetrieved).toString()), results.sha.toString());
    },
    buildUpdateSetXML: function (sysidRetrieved) {
        var tempRetrievedUpdateSet, parentpdateSetXml, childUpdateSetXml, updateSetXml;
        tempRetrievedUpdateSet = new GlideRecord('sys_remote_update_set');
        tempRetrievedUpdateSet.get(sysidRetrieved);
        parentpdateSetXml = this.getXML(tempRetrievedUpdateSet);
        childUpdateSetXml = this.getChildUpdates(tempRetrievedUpdateSet.sys_id.toString());
        parentpdateSetXml = parentpdateSetXml.replace('<?xml version="1.0" encoding="UTF-8"?>', '<?xml version="1.0" encoding="UTF-8"?><unload unload_date="' + GlideSysDateUtil.getUMTDateTimeString() + '">');
        updateSetXml = parentpdateSetXml + childUpdateSetXml + '</unload>';
        return updateSetXml;
    },
    // CONVERTS THE RECORD PROPERTIES FROM AN OBJECT INTO XML
    getXML: function (record) {
        var xmlSerializer, xml;
        xmlSerializer = new GlideRecordXMLSerializer();
        xml = xmlSerializer.serialize(record);
        return xml;
    },
    // LOOPS THROUGH THE UPDATE SETS AND RETURNS AN ARRAY OF SYS_IDS THAT ARE STILL IN PROGRESS
    getSetRecords: function () {
        var setRecord, inProgressSets;
        setRecord = new GlideRecord('sys_update_set');
        setRecord.addEncodedQuery('nameNOT LIKEDefault^state=in progress');
        setRecord.query();
        inProgressSets = [];

        while (setRecord.next()) {
            inProgressSets.push(setRecord.sys_id.toString());
        }
        return inProgressSets;
    },
    // CREATES NET NEW OR UPDATES EXISTING UPDATE SETS
    updateFile: function (TOKEN, fileName, content, sha) {
        var body, getHttpReponse, message;
        try {
            body = {
                "message": fileName + " being updated/created.",
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
    },
    getChildUpdates: function (parentSet) {
        var updatesXML, sysUpdates;
        sysUpdates = new GlideRecord('sys_update_xml');
        sysUpdates.query('remote_update_set', parentSet);
        while (sysUpdates.next()) {
            if (updatesXML) {
                updatesXML += this.getXML(sysUpdates).replace('<?xml version="1.0" encoding="UTF-8"?>', '');
            } else {
                updatesXML = this.getXML(sysUpdates).replace('<?xml version="1.0" encoding="UTF-8"?>', '');
            }
        }
        return updatesXML;
    },
    type: "BackupUpdateSets"
};

// MAIN PROGRAM
updateSetIds = new BackupUpdateSets().getSetRecords();
for (var updateSetId in updateSetIds) {
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
            new BackupUpdateSets().uploadUpdateSetToGithub(sysidRetrieved, fileName);
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