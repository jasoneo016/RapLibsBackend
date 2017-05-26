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
var artistsRef = db.ref("artists");
var albumsRef = db.ref("albums");
var lyricsRef = db.ref("lyrics");
var adLibsRef = db.ref("adlibs");


storeArtistNameImage();
// addImageLink();
// storeAlbums();

function storeArtistNameImage() {

    var params = { Bucket: myBucket,
        Delimiter: '/',
        Prefix: 'RapLibs/'
    };
    s3.listObjects(params, function(err, data) {

        var artistList = [];
        var imageList = [];

        if (err) return console.error(err);

        for (var i = 0; i < data.CommonPrefixes.length; i++) {
            var path = data.CommonPrefixes[i].Prefix.split('/');
            var artistName = path[1];
            artistList.push(artistName);
        }

        for (var i = 0; i < artistList.length; i++) {
            params.Prefix = 'RapLibs/' + artistList[i];
            var artistFace = artistList[i].replace(/\s+/g, '').toLowerCase() + 'face.png';
            var imageLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + params.Prefix + '/' + artistFace;
            imageList.push(imageLink);
        }

        for (var i = 0; i < artistList.length; i++) {
            artistsRef.push({
                name: artistList[i],
                image: imageList[i],
                timestamp: Date.now(),
                counter: 0,
                album1: '',
                lyric1: '',

            });
        }
        return;
    });
}


function storeAlbums() {


    var params = { Bucket: myBucket
        // Delimiter: '/',
        // Prefix: 'RapLibs/'
    };

    s3.listObjects(params, function(err, data) {
        if (err) return console.error(err);

        for(var i = 0; i < data.Contents.length; i++) {
            data.Contents[i].Url = 'https://s3-us-west-1.amazonaws.com/' + data.Name + '/' + data.Contents[i].Key;
            console.log(data.Contents[i].Url);
        }
        return;
    });
}

function storeLyrics() {

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


