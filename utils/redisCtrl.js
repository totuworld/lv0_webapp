'use strict';

var redis = require("redis");
var bluebird = require("bluebird");
bluebird.promisifyAll(redis.RedisClient.prototype);


//{name} : redis 호스트명, {primary key} : 기본 액세스 키 string  
var client = redis.createClient(6379,'{name}.redis.cache.windows.net', {auth_pass: '{primary key}' });

var mainThis = this;
var redisKey = "Lv0Score"; //원하는 명칭으로 변경가능

/** 점수를 업데이트한다.
 * @param {number | string}     id
 * @param {number | string}     Score
 * @returns {Promise}
 */
exports.UpdateScore = function (id, Score) {
    let userKeyStr = `${id}`;
    let convertScore = Score * 1;
    return new Promise(function (resolve, reject) {
        //점수 기록.
        client.zaddAsync(redisKey, convertScore, userKeyStr)
        .then(function(err, replies) {
            resolve(convertScore);
        });
    });
};

/**
 * 점수조회
 * @param {number | string}     id
 * @returns {Promise}
 */
exports.GetScore = function (id) {
    return new Promise(function (resolve, reject) {
        client.zscoreAsync(redisKey, `${id}`).then(function(reply) {
            console.log(`GetScore : ${reply}`);
            if(reply === null) {
                reject();
                return;
            }
            resolve( reply * 1 );
        });
    });
};

/**
 * 랭킹 로딩
 * @param {number | string}     id
 * @returns {Promise}
 */
exports.GetRank = function (id) {
    let saveUserScore = 0;
    return new Promise(function (resolve, reject) {
        mainThis.GetScore(id)
            .catch(function(){ return mainThis.UpdateScore(id, 0); })
            .then(function (userScore) {
                saveUserScore = userScore;
                return mainThis.GetRankWithScore(userScore);
            })
            .then(function(getRank){
                resolve(getRank, saveUserScore);
            });

    });
};

/**
 * 점수를통해 랭킹 획득
 * @param {string | number}     userScore
 * @returns {Promise}
 */
exports.GetRankWithScore = function(userScore) {
    return new Promise(function (resolve, reject) {
        let targetScore = (userScore * 1) + 1;
        client.zcountAsync(redisKey, targetScore, '+inf').then(function(reply) {
            resolve((reply * 1) + 1);
        });
    });
};

/**
 * 일정 구간랭커 로딩.
 * @param {string|number}       min     가장 작은 순위
 * @param {string|number}       max     최대 순위
 * @returns {Promise}
 * @example
 *  1~10위 로딩 시
 *  GetRankers(0, 9).then( //function );
 */
exports.GetRankers = function(min, max) {
    let sendResult = {};
    let RankUserID = [];
    
    function GetRankAndMakeResult(id, score) {
        return new Promise(function(resolve, reject) {
            mainThis.GetRankWithScore(score)
            .then(function(rank) {
                sendResult[id] = { id:id*1, score:score*1, Rank:rank};
                resolve();
            });
        });
    }
    
    return client.zrevrangeAsync(redisKey, min, max, 'withscores')
    .then(function(rangeIdAndScores) {
        //rangeIdAndScores는 홀수가 id이고 짝수가 score이다.
        let promiseList = []
        for(let i=0;i<rangeIdAndScores.length;i=i+2) {
            RankUserID.push(rangeIdAndScores[i]);
            promiseList.push(GetRankAndMakeResult(rangeIdAndScores[i], rangeIdAndScores[i+1]));
        }
        
        return Promise.all(promiseList);
    })
    .then(function(){
        return new Promise(function(resolve, reject) {
            sendResult['RankUserID'] = RankUserID;
            resolve(sendResult);
        });
    })
};