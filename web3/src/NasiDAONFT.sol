// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "openzeppelin-contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "openzeppelin-contracts/utils/Counters.sol";
import "openzeppelin-contracts/access/Ownable.sol";

contract NasiDAONFT is ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;

    struct OwnerData {
        address ownerAddress;
        string profileId;
        uint256 tokenId;
    }

    string constant ipfsURI =
        "ipfs://QmfAbanLn5Bv9hhetNVeDyA78HrPBtcq7FTLrXmVKwsqVF";

    mapping(address => uint256) public nftOwner;
    OwnerData[] public owners;

    constructor() ERC721("Nasi DAO NFT", "NADA") {}

    function registerOwner(address to, string memory _profileId) public {
        uint tokenId = mint(to);
        owners.push(OwnerData(to, _profileId, tokenId));
    }

    function mint(address to) internal onlyOwner returns (uint) {
        require(nftOwner[to] == 0, "You already had an NFT");

        uint newId = _tokenIds.current();
        _safeMint(to, newId);
        _setTokenURI(newId, ipfsURI);
        nftOwner[to] = newId;

        _tokenIds.increment();

        return newId;
    }

    function getAllOwners() public view returns (OwnerData[] memory) {
        return owners;
    }
}
