// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// import "@ganache/console.log/console.sol";

contract EIP712Example {
  
  // storedData, set() and get() aren't a part of the core logic. They are included as a part of the debugging procedure
  // I am debugging the error thrown when executeSetIfSignatureMatch is called from App.js
  uint storedData;

  function set(uint x) internal {
    storedData = x;
  }

  function get() public view returns (uint) {
    return storedData;
  }

  function executeSetIfSignatureMatch(
    uint8 v,
    bytes32 r,
    bytes32 s,
    address sender,
    uint256 deadline,
    uint amount,
    uint nonce
  ) external returns (address) {
    require(block.timestamp < deadline, "Signed transaction expired");

    uint chainId = block.chainid;

    bytes32 eip712DomainHash = keccak256(
        abi.encode(
            keccak256(
                "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
            ),
            keccak256(bytes("SetTest")),
            keccak256(bytes("1")),
            chainId,
            address(this)
        )
    );  

    bytes32 hashStruct = keccak256(
      abi.encode(
          keccak256("set(uint nonce,uint amount)"),
          nonce,
          amount
        )
    );

    bytes32 hash = keccak256(abi.encodePacked("\x19\x01", eip712DomainHash, hashStruct));
    address signer = ecrecover(hash, v, r, s);
    require(signer == sender, "MyFunction: invalid signature");
    require(signer != address(0), "ECDSA: invalid signature");

    set(amount);
    return signer; // Not a part of the core logic too. I'm just checking if this function is working fine or not. It isn't. 
  }
}
