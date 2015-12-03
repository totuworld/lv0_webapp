///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/express/express.d.ts"/>

'use strict';


var express = require('express');
var router = express.Router();
var multer = require('multer');
var fs = require('fs');
var crypto = require('crypto');
var storageCtrl = require('../utils/storageCtrl');




function CreateMd5(str) {
    var md5 = crypto.createHash("md5");
    return md5.update(new Buffer(str, 'utf8')).digest('base64');
}


var upload = multer({ dest: './UploadFiles/' });
router.post('/upload/:fileName', upload.single('myFile'), function(req, res) {

    let filePath = req.file.path;
    let fileName = req.params.fileName;
    let fileSplit =  req.params.fileName.split('.');
    let fileType = fileSplit[1];
    let size = req.file.size;


    let loadedFileData;
    let ReadFile = new Promise(function (resolve, reject) {
        fs.readFile(filePath, 'utf8', function (err, data) {
            loadedFileData = data;
            resolve(data);
        });
    });


    let createdMd5;
    let containerName = 'sample';
    
    ReadFile
    .then(function (fileDatas) {
        //md5 제작
        return new Promise(function (resolve, reject) {
            createdMd5 = CreateMd5(fileDatas);
            resolve();
        });
    })
    .then(function() {
        //storage 초기화
        return storageCtrl.InitBlobService();
    })
    .then(function() {
        //컨테이너 생성
        let options = {publicAccessLevel : 'container'}; //cdn으로 사용하기 위해서 publicAccessLevel 옵션을 추가함.
        return storageCtrl.CreateContainer(containerName, options)
    })
    .then(function () {
        let stream = fs.createReadStream(filePath
            , { flags: 'r',
                ding: null,
                fd: null,
                mode: 0o666,
                autoClose: true,
                bufferSize: 64 * 1024
            });
        let options = {};
        
        if(fileType !== 'json') {
            options['storeBlobContentMD5'] = false;
        }
        else {
            options['contentMD5'] = createdMd5;
        }
        
        //azure에파일 업로드.
        return storageCtrl.uploadBlobs(stream, containerName, fileName, options, size);
    })
    .then(function(createResponse) {
        //성공 결과  생성
        return new Promise(function (resolve, reject) {
            resolve({result:0, response:createResponse});
        });
    })
    .catch(function (err) {
        //error 결과 생성
        return new Promise(function (resolve, reject) {
            console.log(err);
            resolve({result:99, error:`${err}`});
        });
    })
    .then(function (sendResult) {
        //템프파일 삭제.
        fs.unlink(filePath, function (err) {
            //결과 전송.
            res.send(sendResult);
        });
    });
});

module.exports = router;