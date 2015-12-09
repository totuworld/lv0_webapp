///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/express/express.d.ts"/>

'use strict';

var express = require('express');
var router = express.Router();

var models = require('../models');
var redisCtrl = require('../utils/redisCtrl');

router.post('/add/:id/:score', function(req, res){
	let totalScore = 0;
	
	//Score 테이블에 사용자 데이터가 존재하는지 확인
	models.Score.findOne({where:{id:req.params.id}})
	.then(function(findScoreRow) {
		return new Promise(function(resolve, reject) {
			if(findScoreRow !== null) {
				resolve(findScoreRow);
			}
			else {
				reject();
			}
		});
	})
	.catch(function(err) {
		//존재하지 않을 때 생성
		return models.Score.create({id:req.params.id});
	})
	.then(function(scoreRow) {
		//점수 증가
		totalScore = scoreRow.score+(req.params.score*1);
		return models.Score.update({score:totalScore}, {where:{id:scoreRow.id}});
	})
	.then(function(){
		//Redis에 점수 기록
		return redisCtrl.UpdateScore(req.params.id, totalScore);
	})
	.then(function(){
		//결과 전송
		res.send({result:0, score:totalScore});
	});
});

router.get('/ranker', function (req, res) {
	let finalData = [];
	function GetAllUsers(idArray) {
		return models.User.findAll({where:{id:{$in:idArray}}});
	}
	function GetUserName(id, rankData) {
		return models.User.findOne({where:{id:id}})
		.then(function(userInfo){
			return new Promise(function (resolve, reject) {
				rankData['username'] = userInfo['username'];
				finalData.push(rankData);
				resolve();
			});
		});
	}
	
	//상위 10명 랭크 정보 반환
	redisCtrl.GetRankers(0, 9)
	.then(function(result) {
		let idArray = [];
		for(let row of result) {
			idArray.push(row.id);
		}
		return GetAllUsers(idArray).then(function(userRows){
			return new Promise(function(resolve, reject){
				for(let row of result) {
					for(let users of userRows) {
						if(row.id === users.id) {
							row['username'] = users['username'];
							finalData.push(row);
							break;
						}
					}
				}
				resolve();
			});
		});
	})
	.then(function() {
		finalData.sort((a, b)=>a.Rank - b.Rank);
		res.send({result:0, Rank:finalData});
	})
});

module.exports = router;