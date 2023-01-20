var EIP712Example = artifacts.require("./EIP712Example.sol");

module.exports = function(deployer) {
  deployer.deploy(EIP712Example);
};
