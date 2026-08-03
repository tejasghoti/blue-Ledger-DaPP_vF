// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/BlueLedger.sol";
import "../src/BlueLedgerMarketplace.sol";
import "../src/MockERC20.sol";

contract BlueLedgerTest is Test {
    BlueLedger public blueLedger;
    BlueLedgerMarketplace public marketplace;
    MockERC20 public paymentToken;

    address public admin = address(1);
    address public ngo = address(2);
    address public buyer = address(3);

    function setUp() public {
        vm.startPrank(admin);
        blueLedger = new BlueLedger();
        paymentToken = new MockERC20();
        marketplace = new BlueLedgerMarketplace(address(blueLedger), address(paymentToken));
        blueLedger.addNgo(ngo);
        vm.stopPrank();

        // Mint payment tokens to buyer
        paymentToken.mint(buyer, 10000 * 10**18);
    }

    function testRegisterProject() public {
        vm.prank(ngo);
        blueLedger.registerProject("Sundarbans Restoration", "India", "QmHash123");

        (uint256 id, string memory name, string memory location, string memory metadataHash, address owner, BlueLedger.ProjectStatus status,,,,,,) = blueLedger.projects(1);

        assertEq(id, 1);
        assertEq(name, "Sundarbans Restoration");
        assertEq(location, "India");
        assertEq(metadataHash, "QmHash123");
        assertEq(owner, ngo);
        assertTrue(status == BlueLedger.ProjectStatus.PENDING);
    }

    function testSubmitMRVAndVerify() public {
        // 1. Register project
        vm.prank(ngo);
        blueLedger.registerProject("Sundarbans Restoration", "India", "QmHash123");

        // 2. Submit MRV
        vm.prank(ngo);
        blueLedger.submitMRVData(1, "QmMRVDataHash456");

        assertTrue(blueLedger.getProjectStatus(1) == BlueLedger.ProjectStatus.AWAITING_VERIFICATION);

        // 3. Verify & Mint
        vm.prank(admin);
        blueLedger.verifyAndMintCredits(1, 100, 500);

        assertTrue(blueLedger.getProjectStatus(1) == BlueLedger.ProjectStatus.VERIFIED);
        assertEq(blueLedger.balanceOf(ngo, 1), 100);
    }

    function testRetireCredits() public {
        // Setup verified project with minted credits
        vm.prank(ngo);
        blueLedger.registerProject("Sundarbans Restoration", "India", "QmHash123");

        vm.prank(ngo);
        blueLedger.submitMRVData(1, "QmMRVDataHash456");

        vm.prank(admin);
        blueLedger.verifyAndMintCredits(1, 100, 500);

        // NGO retires 30 credits
        vm.prank(ngo);
        blueLedger.retireCredits(1, 30, "ESG Compliance Offset");

        assertEq(blueLedger.balanceOf(ngo, 1), 70);

        (,,,,,,,,uint256 retiredAmount,,,) = blueLedger.projects(1);
        assertEq(retiredAmount, 30);
    }

    function testMarketplaceListAndBuy() public {
        // Setup verified project
        vm.prank(ngo);
        blueLedger.registerProject("Sundarbans Restoration", "India", "QmHash123");
        vm.prank(ngo);
        blueLedger.submitMRVData(1, "QmMRVDataHash456");
        vm.prank(admin);
        blueLedger.verifyAndMintCredits(1, 100, 500);

        // NGO lists credits via safeTransferFrom
        vm.startPrank(ngo);
        bytes memory data = abi.encode(10 * 10**18); // 10 payment tokens per unit
        blueLedger.safeTransferFrom(ngo, address(marketplace), 1, 50, data);
        vm.stopPrank();

        (uint256 listingId, uint256 projId, address seller, uint256 qty, uint256 price, bool active) = marketplace.listings(1);
        assertEq(listingId, 1);
        assertEq(projId, 1);
        assertEq(seller, ngo);
        assertEq(qty, 50);
        assertEq(price, 10 * 10**18);
        assertTrue(active);

        // Buyer approves marketplace and buys 20 credits
        vm.startPrank(buyer);
        paymentToken.approve(address(marketplace), 1000 * 10**18);
        marketplace.buyCredits(1, 20);
        vm.stopPrank();

        assertEq(blueLedger.balanceOf(buyer, 1), 20);
    }
}
