///<reference path="../typings/node/node.d.ts"/>
///<reference path="../typings/express/express.d.ts"/>

'use strict';

var express = require('express');
var router = express.Router();

var models = require('../models');

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
		//결과 전송
		res.send({result:0, score:totalScore});
	});
});

module.exports = router;