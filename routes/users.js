///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/express/express.d.ts"/>

'use strict';

var express = require('express');
var router = express.Router();

var models = require('../models');

router.get('/info/:id', function(req, res, next) {
    //사용자 검색.
    models.User.findOne({where:{id:req.params.id}})
    .then(function(result) {
        if(result !== null) {
            res.send({result:0, body:result});
        }
        else {
            res.send({result:98, body:'do not exist'});
        }
    });
});

router.post('/add/:username', function(req, res) {
    function MakeResult(stateCode, resultValue) {
        return {result:stateCode, body:resultValue};
    }
    //동일한 username이 사용중인지 체크
    models.User.findOne({where:{username:req.params.username}})
    .then(function(findResult) {
        return new Promise(function(resolve, reject) {
            //사용중이면 에러 처리
            if(findResult !== null) {
                reject('exist');
                return;
            }
            resolve();
        });
    }).then(function(){
        //새로운 user 생성
        return models.User.create({username:req.params.username}).then(function(result){
            return new Promise(function(resolve, reject) {
                resolve(MakeResult(0, result));
            });
        });
    }).catch(function(err) {
        //에러 발생 처리 부분
        return new Promise(function (resolve, reject) {
            console.log(`error : ${err}`);
            resolve(MakeResult(99, err));
        });
    }).then(function(returnValue) {
        //최종 결과 전송
        res.send(returnValue);
    });
});

module.exports = router;
