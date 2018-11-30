var LoteriaNormal = artifacts.require("./LoteriaNormal.sol");
var LoreriaRetirable = artifacts.require("./LoteriaRetirable.sol");

module.exports = function(deployer) {
  deployer.deploy(LoteriaNormal);
  deployer.deploy(LoreriaRetirable);
};
