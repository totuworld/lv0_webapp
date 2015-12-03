'use strict';

var azure = require('azure-storage');

var STORAGE_KEY = '{access key}'; //액세스 키
var STORAGE_ACCOUNT_NAME = '{account name}'; //저장소 계정이름


var blobService;
var isInit = false;

/**
 * 초기화 여부 체크에 사용.
 * @type {boolean}
 */
exports.isInit = isInit;

/**
 * 초기화 진행
 */
exports.InitBlobService = function () {
    return new Promise(function (resolve, reject) {
        if(isInit === true) {
            resolve();
            return;
        }
        
        console.log('init blob service');
        blobService = azure.createBlobService(STORAGE_ACCOUNT_NAME, STORAGE_KEY);
        isInit = true;
        resolve();
    });
};

/**
 * 컨테이너 제작
 * @param {string}		container	컨테이너명
 * @param {object}		options		옵션 //{publicAccessLevel : 'container'}
 * @returns {Promise}
 */
exports.CreateContainer = function (container, options) {
    return new Promise(function (resolve, reject) {
        // Create the container.
        blobService.createContainerIfNotExists(container, options, function (error) {
            if (error) {
                console.log('createContainerIfNotExists err : ', error);
                reject(error);
            } else {
                console.log('Created the container ' + container);
                resolve();
            }
        });
    });
};


/**
 * 파일을 저장한다.
 * @param               fileStream            파일내용.
 * @param {string}      containerName   저장할 컨테이너명.
 * @param {string}      blobName        저장할 파일명.
 * @param {object}      options             옵션 //{contentMD5:md5, storeBlobContentMD5:true} 
 * @param {number}      size            파일 사이즈
 */
exports.uploadBlobs = function (fileStream, containerName, blobName, options, size) {
    return new Promise(function (resolve, reject) {
		blobService.createBlockBlobFromStream(containerName, blobName, fileStream, size, options, function(err, createBlob, createResponse) {
			if (err) {
				console.log('createBlockBlobFromStream err : ', err);
				reject(err);
			} else {
				console.log(' Blob ' + blobName + ' upload finished.');
				resolve(createResponse);
			}
		});
	});
};