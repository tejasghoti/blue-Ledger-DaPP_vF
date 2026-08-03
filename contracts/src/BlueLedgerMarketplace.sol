// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155Receiver.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract BlueLedgerMarketplace is Ownable, IERC1155Receiver, ReentrancyGuard {
    IERC1155 public immutable blueLedgerContract;
    IERC20 public immutable paymentToken;

    struct Listing {
        uint256 listingId;
        uint256 projectId;
        address seller;
        uint256 quantity;
        uint256 pricePerUnit;
        bool active;
    }

    uint256 private _listingCounter;
    mapping(uint256 => Listing) public listings;
    mapping(uint256 => uint256) public activeListingIdForProject;

    uint256 public platformFeePercentage;
    uint256 public royaltyFeePercentage; // 5% royalty for coastal NGO project owners

    event CreditsListed(uint256 indexed listingId, uint256 indexed projectId, address indexed seller, uint256 quantity, uint256 pricePerUnit);
    event CreditsSold(uint256 listingId, uint256 indexed projectId, address indexed seller, address indexed buyer, uint256 quantity, uint256 totalPrice);
    event ListingCancelled(uint256 indexed listingId, uint256 indexed projectId);

    constructor(address _blueLedgerAddress, address _paymentTokenAddress) Ownable(msg.sender) {
        blueLedgerContract = IERC1155(_blueLedgerAddress);
        paymentToken = IERC20(_paymentTokenAddress);
        platformFeePercentage = 250; // 2.5%
        royaltyFeePercentage = 500;  // 5.0%
    }

    function onERC1155Received(address, address from, uint256 id, uint256 value, bytes memory data) public virtual override returns (bytes4) {
        require(msg.sender == address(blueLedgerContract), "Only BLC tokens are accepted");
        uint256 pricePerUnit = abi.decode(data, (uint256));
        _createListing(id, from, value, pricePerUnit);
        return this.onERC1155Received.selector;
    }

    function _createListing(uint256 _projectId, address _seller, uint256 _quantity, uint256 _pricePerUnit) private {
        require(_quantity > 0, "Quantity must be greater than zero");
        require(_pricePerUnit > 0, "Price must be greater than zero");
        require(activeListingIdForProject[_projectId] == 0, "Project already has an active listing");

        _listingCounter++;
        uint256 newListingId = _listingCounter;
        
        listings[newListingId] = Listing({
            listingId: newListingId,
            projectId: _projectId,
            seller: _seller,
            quantity: _quantity,
            pricePerUnit: _pricePerUnit,
            active: true
        });

        activeListingIdForProject[_projectId] = newListingId;
        emit CreditsListed(newListingId, _projectId, _seller, _quantity, _pricePerUnit);
    }

    function buyCredits(uint256 _listingId, uint256 _quantityToBuy) external nonReentrant {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing is not active");
        require(_quantityToBuy > 0, "Must buy at least one credit");
        require(listing.quantity >= _quantityToBuy, "Not enough credits in listing");

        uint256 totalPrice = _quantityToBuy * listing.pricePerUnit;
        uint256 fee = (totalPrice * platformFeePercentage) / 10000;
        uint256 royalty = (totalPrice * royaltyFeePercentage) / 10000;
        uint256 sellerProceeds = totalPrice - fee - royalty;

        require(paymentToken.transferFrom(msg.sender, listing.seller, sellerProceeds + royalty), "Payment to seller failed");
        require(paymentToken.transferFrom(msg.sender, owner(), fee), "Payment of platform fee failed");
        
        blueLedgerContract.safeTransferFrom(address(this), msg.sender, listing.projectId, _quantityToBuy, "");

        listing.quantity -= _quantityToBuy;
        if (listing.quantity == 0) {
            listing.active = false;
            delete activeListingIdForProject[listing.projectId];
        }

        emit CreditsSold(_listingId, listing.projectId, listing.seller, msg.sender, _quantityToBuy, totalPrice);
    }

    function unlistCredits(uint256 _listingId) external {
        Listing storage listing = listings[_listingId];
        require(listing.active, "Listing is not active");
        require(listing.seller == msg.sender, "You are not the seller");

        listing.active = false;
        delete activeListingIdForProject[listing.projectId];

        blueLedgerContract.safeTransferFrom(address(this), msg.sender, listing.projectId, listing.quantity, "");
        
        emit ListingCancelled(_listingId, listing.projectId);
    }
    
    // --- Required Functions for IERC1155Receiver ---
    function onERC1155BatchReceived(address, address, uint256[] memory, uint256[] memory, bytes memory) public virtual override returns (bytes4) {
        revert("Batch transfers not supported");
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IERC1155Receiver).interfaceId;
    }
}