var Loteria = artifacts.require("./Loteria.sol");
var LoreriaRetirable = artifacts.require("./LoteriaRetirable.sol");

module.exports = function(deployer) {
  deployer.deploy(Loteria);
  deployer.deploy(LoreriaRetirable);
};
