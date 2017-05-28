//AWS S3 Bucket
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
AWS.config.update({region:'us-west-1'});

//Config file for root access to add and delete
AWS.config.loadFromPath('aws-config.json');
var myBucket = 'raplibsbucket';

//Firebase Authorization
var admin = require("firebase-admin");
var serviceAccount = require("/Users/admin/IdeaProjects/RapLibsFirebase/rap-libs-firebase-adminsdk-fu0za-15f6bd6601.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://rap-libs.firebaseio.com"
});

//Firebase Relational Database
var db = admin.database();
var artistsRef = db.ref("artists");
var albumsRef = db.ref("albums");
var lyricsRef = db.ref("lyrics");
var adLibsRef = db.ref("adlibs");

deleteDSStore();
storeArtistNameImage();
storeAlbums();
storeAdLibs();
// storeLyrics();


function storeArtistNameImage() {

    var params = { Bucket: myBucket,
        Delimiter: '/',
        Prefix: 'RapLibs/'
    };
    s3.listObjects(params, function(err, data) {

        var artistList = [];
        var imageList = [];
        var artistKeyList = [];

        if (err) return console.error(err);

        for (var i = 0; i < data.CommonPrefixes.length; i++) {
            var path = data.CommonPrefixes[i].Prefix.split('/');
            var artistName = path[1];
            artistList.push(artistName);
        }

        for (var i = 0; i < artistList.length; i++) {
            params.Prefix = 'RapLibs/' + artistList[i];
            var artistKey = artistList[i].replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
            var artistFace = artistList[i].replace(/\s+/g, '').toLowerCase() + 'face.png';
            var imageLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + params.Prefix + '/' + artistFace;
            imageList.push(imageLink);
            artistKeyList.push(artistKey);
        }

        for (var i = 0; i < artistList.length; i++) {
            artistsRef.child(artistKeyList[i]).set({
                image: imageList[i],
                timestamp: Date.now(),
                counter: 0
            });
        }

        return;
    });
}

//nested for loop n^3
//1st: get artist (name, image, timestamp, counter),(get UUID), var artistUUID, arrayListAlbumUUID, arrayListLyricsUUID, arrayListAdLibs
//2nd: get albums (name, image, timestamp, counter), (get UUID), var albumUUID stored into albumUUIDArray for artist to use
//      arrayListLyrics for album
//3rd: get lyrics from album (lyrics, name, image, timestamp, counter, download link) store into arrayListLyricsUUID for artist
function storeAlbums() {


    var params = { Bucket: myBucket};

    s3.listObjects(params, function(err, data) {

        var tempAlbumList = [];
        var albumList = [];
        var imageList = [];

        if (err) return console.error(err);

        for(var i = 0; i < data.Contents.length; i++) {
            if (data.Contents[i].Key.includes('Albums')) {
                var path = data.Contents[i].Key.split('/');
                tempAlbumList.push(path[1] + '/' + path[3]);
                albumList = tempAlbumList.filter(onlyUnique);
            }
        }

        for(var i = 0; i < albumList.length; i++) {

            var albumPath = albumList[i].split('/');
            var artistName = albumPath[0];
            params.Prefix = 'RapLibs/' + artistName + '/Albums/';
            var albumName = albumPath[1];
            var albumPic = albumName.replace(/\s+/g, '').toLowerCase() + '.jpg';
            var albumPicLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + params.Prefix + albumName + '/' + albumPic;
            imageList.push(albumPicLink);

            albumsRef.push({
                name: albumName,
                image: albumPicLink,
                artist: artistName,
                timestamp: Date.now(),
                counter: 0,
                lyric1: ''
            });

            var artistKey = artistName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
            artistsRef.child(artistKey).child(albumName).set({
                uuid: albumsRef.push().key
            });
        }
        return;
    });
}

function storeAdLibs() {

    var params = { Bucket: myBucket};

    s3.listObjects(params, function(err, data) {

        if (err) return console.error(err);

        for(var i = 0; i < data.Contents.length; i++) {
            if (data.Contents[i].Key.includes('.mp3')) {
                path = data.Contents[i].Key.split('/');
                var artistName = path[1];
                if (data.Contents[i].Key.includes('AdLibs') && path[3].includes('.mp3')) {
                    var mp3AdLibLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + data.Contents[i].Key;
                    var artistKey = artistName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
                    var artistPic = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/RapLibs/' + artistName + '/AdLibs/'
                        + artistKey + '.jpg';
                    var lyric = path[3].substr(0, path[3].length - 4);
                    adLibsRef.push({
                        artist: artistName,
                        image: artistPic,
                        lyric: lyric,
                        mp3: mp3AdLibLink,
                        timestamp: Date.now(),
                        counter: 0
                    });

                    var artistKey = artistName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
                    artistsRef.child(artistKey).child("Ad Libs").set({
                        uuid: adLibsRef.push().key
                    });
                }
                // else if (data.Contents[i].Key.includes('AdLibs') && !path[3].includes('.mp3')) {
                //     var albumName = path[3];
                //     var songName = path[4];
                //     var lyric = path[5].substr(0, path[5].length - 4);
                //     var mp3AdLibLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + data.Contents[i].Key;
                //     var pic = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/RapLibs/' + artistName + '/AdLibs/'
                //         + albumName + '/' + songName + '/pic.jpg';
                //     adLibsRef.push({
                //         artist: artistName,
                //         image: pic,
                //         lyric: lyric,
                //         mp3: mp3AdLibLink,
                //         timestamp: Date.now(),
                //         counter: 0
                //     });
                //     var artistKey = artistName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
                //     artistsRef.child(artistKey).child("Ad Libs").set({
                //         uuid: adLibsRef.push().key
                //     });
                // }
            }
        }
        return;
    });
}

function storeLyrics() {

    var params = { Bucket: myBucket};

    s3.listObjects(params, function(err, data) {

        if (err) return console.error(err);

        for(var i = 0; i < data.Contents.length; i++) {
            if (data.Contents[i].Key.includes('.mp3') && (data.Contents[i].Key.includes('Albums'))) {
                console.log(data.Contents[i].Key);
                path = data.Contents[i].Key.split('/');
                var artistName = path[1];
                var albumName = path[3];
                var songName = path[4];
                var mp3SongLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + data.Contents[i].Key;
                var albumKey = albumName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
                var albumPic = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/RapLibs/' + artistName + '/Albums/'
                    + albumKey + '.jpg';
                var lyric = path[3].substr(0, path[3].length-4);
                // adLibsRef.push({
                //     artist: artistName,
                //     image: artistPic,
                //     lyric: lyric,
                //     mp3: mp3AdLibLink,
                //     timestamp: Date.now(),
                //     counter: 0
                // });
                //
                // var artistKey = artistName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
                // artistsRef.child(artistKey).child("Ad Libs").set({
                //     uuid: adLibsRef.push().key
                // });

            }
        }
        return;
    });
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function deleteDSStore() {

    var DSStore = '.DS_Store';
    var params = { Bucket: myBucket };

    s3.listObjects(params, function(err, data) {
        for(var i = 0; i < data.Contents.length; i++) {
            if (data.Contents[i].Key.includes(DSStore)) {
                console.log(data.Contents[i].Key);
                params.Delete = {Objects:[]};
                params.Delete.Objects.push({Key: data.Contents[i].Key});

                s3.deleteObjects(params, function (err, data) {
                    if (data) {
                        console.log(".DS_Store file deleted successfully.");
                    }
                    else {
                        console.log("Check if you have sufficient permissions : "+err);
                    }
                });
            }
        }
    });
}


