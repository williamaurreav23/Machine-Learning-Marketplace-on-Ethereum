pragma solidity ^0.4.18;

contract Contract {
  string ipfsHash;

  function sendHash(string x) public {
    ipfsHash = x;
  }

  function getHash() public view returns (string x) {
    return ipfsHash;
  }


}
