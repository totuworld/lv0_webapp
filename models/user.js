"use strict";

module.exports = function(sequelize, DataTypes) {
  var User = sequelize.define("User", {
    username: {type:DataTypes.STRING}, //사용자 이름
    gold: {type:DataTypes.INTEGER, defaultValue:1000}, //골드
    gem: {type:DataTypes.INTEGER, defaultValue:10} //보석
  },
  {timestamps:false} //타입스탬프 컬럼이 생성되지 않도록 처리.
  );

  return User;
};