var AWS = require('aws-sdk');
var s3 = new AWS.S3();
AWS.config.update({region:'us-west-1'});

var myBucket = 'raplibsbucket';

var admin = require("firebase-admin");

var serviceAccount = require("/Users/admin/IdeaProjects/RapLibsFirebase/rap-libs-firebase-adminsdk-fu0za-15f6bd6601.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://rap-libs.firebaseio.com"
});

var db = admin.database();


storeArtistNames();

function storeArtistNames() {

    var artistsList;
    var artistsRef = db.ref("artists");
    var params = { Bucket: myBucket,
        Delimiter: '/',
        Prefix: 'RapLibs/'
    };
    s3.listObjects(params, function(err, data) {

        artistsList = [];

        if (err) return console.error(err);

        for (var i = 0; i < data.CommonPrefixes.length; i++) {
            var path = data.CommonPrefixes[i].Prefix.split('/');
            var artistName = path[1];
            // console.log(artistName);
            artistsList.push(artistName);
            artistsRef.set({
                name: artistName
            });
        }
        return;
    });
}

function storeAlbums() {

    var albumsRef = db.ref("albums");

    var params = { Bucket: myBucket,
        Delimiter: '/',
        Prefix: 'RapLibs/'
    };

    s3.listObjects(params, function(err, data) {
        if (err) return console.error(err);

        for(var i = 0; i < data.Contents.length; i++) {
            data.Contents[i].Url = 'https://s3-us-west-1.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;

            albumsRef.push({
                name: artistName,
                image: data.Contents[i].Url,
                albums: ""
            });
            console.log(data.Contents[i].Url);
        }
        return;
    });
}

function storeLyrics() {

    var lyricsRef = db.ref("lyrics");

    var params = { Bucket: myBucket,
        Delimiter: '/',
        Prefix: 'RapLibs/'
    };

    s3.listObjects(params, function(err, data) {
        if (err) return console.error(err);

        for(var i = 0; i < data.Contents.length; i++) {
            data.Contents[i].Url = 'https://s3-us-west-1.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;

            lyricsRef.push({
                name: artistName,
                image: data.Contents[i].Url,
                albums: ""
            });
            console.log(data.Contents[i].Url);
        }
        return;
    });
}

function storeAdLibs() {

    var adLibsRef = db.ref("adlibs");

    var params = { Bucket: myBucket,
        Delimiter: '/',
        Prefix: 'RapLibs/'
    };

    s3.listObjects(params, function(err, data) {
        if (err) return console.error(err);

        for(var i = 0; i < data.Contents.length; i++) {
            data.Contents[i].Url = 'https://s3-us-west-1.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;

            adLibsRef.push({
                name: artistName,
                image: data.Contents[i].Url,
                albums: ""
            });
            console.log(data.Contents[i].Url);
        }
        return;
    });
}


