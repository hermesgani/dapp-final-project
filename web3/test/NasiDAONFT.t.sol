// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "../src/NasiDAONFT.sol";

contract NasiDAONFTTest is Test {
    NasiDAONFT public nasiDAO;
    address owner;
    address userDAO = address(0xBEEF);

    function setUp() public {
        nasiDAO = new NasiDAONFT();
        owner = msg.sender;
    }

    function testRegisterOwner() public {
        nasiDAO.registerOwner(userDAO, "0xProfileLens");
        (address user, , ) = nasiDAO.owners(0);
        uint ownerTokenId = nasiDAO.nftOwner(address(owner));

        assertEq(user, userDAO);
        assertEq(ownerTokenId, 0);
    }

    function testMintFromRegisterOwner() public {
        nasiDAO.registerOwner(owner, "0xOwner");
        (, , uint initialTokenId) = nasiDAO.owners(0);
        assertEq(initialTokenId, 0);

        nasiDAO.registerOwner(userDAO, "0xProfile");
        (, , uint incrementTokenId) = nasiDAO.owners(1);
        assertEq(incrementTokenId, 1);
    }

    function testFailedAlreadyMint() public {
        nasiDAO.registerOwner(userDAO, "0xProfile");

        (, , uint currentTokenId) = nasiDAO.owners(0);
        assertEq(currentTokenId, 0);

        nasiDAO.registerOwner(userDAO, "0xProfile");
        vm.expectRevert("You already had an NFT");
    }

    function testGetAllOwners() public {
        nasiDAO.registerOwner(owner, "0xOwner");
        (address ownerDAO, , ) = nasiDAO.owners(0);

        assertEq(ownerDAO, owner);

        nasiDAO.registerOwner(userDAO, "0xProfile");
        (address secondUser, , ) = nasiDAO.owners(1);

        assertEq(secondUser, userDAO);
    }
}
