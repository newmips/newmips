var webdav = require('../config/webdav');
var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var btoa = require('btoa');

exports.webdav_createdir = function(lib, id) {
    var req3 = new XMLHttpRequest();
    req3.open('MKCOL', webdav.url + lib + '/' + id, true);
    req3.setRequestHeader("Authorization", "Basic " + btoa(webdav.user_name + ':' + webdav.password));
    req3.onreadystatechange = function() {
        if (req3.readyState == 4) {
            console.log('Folder ' + webdav.url + lib + '/' + id + ' created.');
        }
    };
    req3.send();
};

exports.webdav_rmdir = function(lib, id) {
    var req3 = new XMLHttpRequest();
    req3.open('DELETE', webdav.url + lib + '/' + id, true);
    req3.setRequestHeader("Authorization", "Basic " + btoa(webdav.user_name + ':' + webdav.password));
    req3.onreadystatechange = function() {
        if (req3.readyState == 4) {
            console.log('Folder ' + webdav.url + lib + '/' + id + ' removed.');
        }
    };
    req3.send();
};

// lib = library to read - means the type of object ( enlevement, pdc, préfacturation )
// id = id of object to create into the library when folder does not exist yet
exports.webdav_readdir = function(lib, id) {

    // List files folder
    // Build the HTTP request object.
    // do not use the name req reserved for the html request used for the user session
    var req2 = new XMLHttpRequest();
    req2.open('PROPFIND', webdav.url + lib + '/' + id + '/', false);
    req2.setRequestHeader("Authorization", "Basic " + btoa(webdav.user_name + ':' + webdav.password));
    req2.onreadystatechange = function() {
        if (req2.readyState == 4) {
            console.log('Directory ' + webdav.url + lib + '/' + id + '/' + ' listed.');
        }
    };
    req2.send(null);
    // console.log(req2.status);
    if (req2.status == 207) {
        // console.log(req2.responseText);
        // var xml = "<book><title>Harry Potter</title></book>"
        // var doc = new dom().parseFromString(req2.responseText);
        // console.log(doc);
        var doc = new dom().parseFromString(req2.responseText);
        var select = xpath.useNamespaces({
            "d": "DAV:"
        });
        var nodes = select('//d:href', doc);

        // DO NOT DELETE THIS COMMENT !!!!
        // console.log(nodes[0].localName + ": " + nodes[0].firstChild.data);
        // console.log("node: " + nodes[0].toString());
        var i = 1;
        var finished = false;
        var str_folder = "{";
        while (finished == false) {
            if (!nodes[i]) {
                finished = true;
            } else {
                if (i != 1) {
                    str_folder = str_folder + ',';
                }
                str_folder = str_folder + '"' + i + '": ';

                // Set nom_fichier
                // ex : newmips.png
                j = nodes[i].firstChild.data.lastIndexOf("/") + 1;
                nom_fichier = nodes[i].firstChild.data.substr(j);

                // Set url_fichier
                // ex : /owncloud/remote.php/webdav/aper/enlevement/1/newmips.png
                url_fichier = nodes[i].firstChild.data;
                str_folder = str_folder + '{ "nom_fichier" : "' + nom_fichier + '" , "url_fichier":"' + url_fichier + '" }';

                finished = false;
            }
            i++;
        }
        str_folder = str_folder + "}";
        console.log(str_folder)

        return JSON.parse(str_folder);

    } else {

        // repository to create
        console.log("profile - create MKCOL");
        var req3 = new XMLHttpRequest();
        req3.open('MKCOL', webdav.url + lib + '/' + id, true);
        req3.setRequestHeader("Authorization", "Basic " + btoa(webdav.user_name + ':' + webdav.password));
        req3.onreadystatechange = function() {
            if (req3.readyState == 4) {
                console.log('Folder ' + webdav.url + lib + '/' + id + ' created.');
            }
        };
        req3.send();
        console.log("statut MKCOL = " + req3.status + "--" + req3.statusText);
    }

    return {};
}