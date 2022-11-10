// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "openzeppelin-contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/utils/Counters.sol";
import "openzeppelin-contracts/access/Ownable.sol";

contract NasiDAONFT is ERC721("Nasi DAO NFT", "NADA"), Ownable {
    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;

    string constant ipfsURI =
        "ipfs://QmQubJS4KtK49i458kGe4BosUP6WNjBrJ8zqVoTEYSa3jg";

    mapping(address => uint256) public nftOwner;

    function mint(address to) public onlyOwner returns (uint) {
        require(nftOwner[to] == 0, "You already had an NFT");

        uint newId = _tokenIds.current();
        _safeMint(to, newId);
        _setTokenURI(newId, ipfsURI);
        nftOwner[to] = newId;

        _tokenIds.increment();

        return newId;
    }
}
