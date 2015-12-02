"use strict";

module.exports = function(sequelize, DataTypes) {
  var Score = sequelize.define("Score", {
    id: {type:DataTypes.INTEGER, primaryKey:true}, //사용자 구분
    score: {type:DataTypes.INTEGER, defaultValue:0} //점수기록
  },
  {timestamps:false} //타입스탬프 컬럼이 생성되지 않도록 처리.
  );

  return Score;
};