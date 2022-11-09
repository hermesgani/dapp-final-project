// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "openzeppelin-contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/utils/Counter.sol";
import "openzeppelin-contracts/access/Ownable.sol";

contract NasiDAONFT is ERC721("Nasi DAO NFT", "NADA"), Ownable {
    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;

    string constant baseURI =
        "/ipfs/Qmf6sEFHK44AhFH8SE43QPnw4z7QUCEMhhLHvRSXdpYCY4/";

    function _baseURI() internal view virtual override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
    }

    function mint(address to) public onlyOwner returns (uint) {
        uint newId = _tokenIds.current();
        _safeMint(to, newId);

        _tokenIds.increment();

        return newId;
    }
}
