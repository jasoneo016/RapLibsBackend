//AWS S3 Bucket
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
AWS.config.update({region:'us-west-1'});

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

deleteDSStore();
setTimeout(storeDataIntoDatabase,500);


function storeDataIntoDatabase() {
    storeArtistNameImage();
    storeAlbums();
    storeAdLibs();
    storeLyrics();
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
            var artistFace = artistList[i].replace(/[ ,.]/g, "").toLowerCase() + 'face.png';
            var imageLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + params.Prefix + '/' + artistFace;
            imageList.push(imageLink);
            artistKeyList.push(artistKey);
        }

        for (var i = 0; i < artistList.length; i++) {
            artistsRef.child(artistKeyList[i]).set({
                name: artistList[i],
                image: imageList[i],
                timestamp: Date.now(),
                counter: 0
            });
        }

        return;
    });
}

function storeAlbums() {

    var albumuuidCounter = 0;

    var params = { Bucket: myBucket};
    s3.listObjects(params, function(err, data) {

        var tempAlbumList = [];
        var albumList = [];
        var imageList = [];
        var uniqueArtists = [];

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
            var artistKey = artistName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
            params.Prefix = 'RapLibs/' + artistName + '/Albums/';
            var albumName = albumPath[1];
            var albumPic = albumName.replace(/\s+/g, '').toLowerCase() + '.jpg';
            var albumPicLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + params.Prefix + albumName + '/' + albumPic;
            imageList.push(albumPicLink);

            var newAlbumsRef = albumsRef.push();
            var uuidKey = newAlbumsRef.key;

            var albumData={
                name: albumName,
                image: albumPicLink,
                artist: artistName,
                timestamp: Date.now(),
                counter: 0
            }

            newAlbumsRef.set(albumData);

            if (uniqueArtists.includes(artistKey)) {
                albumuuidCounter++;
            } else {
                uniqueArtists.push(artistKey);
                albumuuidCounter = 0;
            }

            var uuid = 'uuid' + albumuuidCounter;
            var updatedUUIDs = {};
            updatedUUIDs[uuid] = uuidKey;
            artistsRef.child(artistKey).child("Albums").update(updatedUUIDs);
        }
        return;
    });
}

function storeAdLibs() {

    var adlibuuidCounter = 0;

    var params = { Bucket: myBucket};

    s3.listObjects(params, function(err, data) {

        var uniqueArtists = [];

        if (err) return console.error(err);

        for(var i = 0; i < data.Contents.length; i++) {
            if (data.Contents[i].Key.includes('.mp3')) {
                var path = data.Contents[i].Key.split('/');
                var artistName = path[1];
                if (data.Contents[i].Key.includes('AdLibs') && path[3].includes('.mp3')) {
                    var mp3AdLibLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + data.Contents[i].Key;
                    var artistKey = artistName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
                    var artistPic = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/RapLibs/' + artistName + '/'
                        + artistKey + '.jpg';
                    var lyric = path[3].substr(0, path[3].length - 4);

                    var newLyricsRef = lyricsRef.push();
                    var uuidKey = newLyricsRef.key;

                    var adLibData={
                        artist: artistName,
                        image: artistPic,
                        lyric: lyric,
                        mp3: mp3AdLibLink,
                        album: '',
                        song: '',
                        timestamp: Date.now(),
                        counter: 0
                    }

                    newLyricsRef.set(adLibData);

                    if (uniqueArtists.includes(artistKey)) {
                        adlibuuidCounter++;
                    } else {
                        uniqueArtists.push(artistKey);
                        adlibuuidCounter = 0;
                    }

                    var uuid = 'uuid' + adlibuuidCounter;
                    var updatedUUIDs = {};
                    updatedUUIDs[uuid] = uuidKey;
                    artistsRef.child(artistKey).child("Ad Libs").update(updatedUUIDs);
                }
            }
        }
        return;
    });
}

function storeLyrics() {

    var lyrcuuidCounter = 0;

    var params = { Bucket: myBucket};

    s3.listObjects(params, function(err, data) {

        var uniqueArtists = [];

        if (err) return console.error(err);

        for(var i = 0; i < data.Contents.length; i++) {
            if (data.Contents[i].Key.includes('.mp3') && (data.Contents[i].Key.includes('Albums'))) {
                path = data.Contents[i].Key.split('/');
                var artistName = path[1];
                var artistKey = artistName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
                var albumName = path[3];
                var songName = path[4];
                var mp3SongLink = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/' + data.Contents[i].Key;
                var albumKey = albumName.replace(/[ ,.]/g, "").replace('$', 's').toLowerCase();
                var albumPic = 'https://s3-us-west-1.amazonaws.com/' + 'raplibsbucket/RapLibs/' + artistName + '/Albums/'
                    + albumName + '/'  + albumKey + '.jpg';
                var lyric = path[5].substr(0, path[5].length-4);

                var newLyricsRef = lyricsRef.push();
                var uuidKey = newLyricsRef.key;

                var lyricsData={
                    artist: artistName,
                    image: albumPic,
                    lyric: lyric,
                    mp3: mp3SongLink,
                    album: albumName,
                    song: songName,
                    timestamp: Date.now(),
                    counter: 0
                }

                newLyricsRef.set(lyricsData);

                if (uniqueArtists.includes(artistKey)) {
                    lyrcuuidCounter++;
                } else {
                    uniqueArtists.push(artistKey);
                    lyrcuuidCounter = 0;
                }

                var uuid = 'uuid' + lyrcuuidCounter;
                var updatedUUIDs = {};
                updatedUUIDs[uuid] = uuidKey;
                artistsRef.child(artistKey).child("Lyrics").update(updatedUUIDs);
            }
        }
        return;
    });
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}