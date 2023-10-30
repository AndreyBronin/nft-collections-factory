// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import '@openzeppelin/contracts/access/Ownable.sol';
import "./Collection.sol";

contract CollectionFactory is Ownable {
    event CollectionCreated(address collection, string name, string symbol);
    event TokenMinted(address collection, address recipient, uint256 tokenId, string tokenUri);

    function createCollection(string memory name, string memory symbol) external {
        Collection c = new Collection(name, symbol);

        emit CollectionCreated(address(c), name, symbol);
    }

    function mint(Collection c) external {
        c.mint();

        uint256 tokenId = c.totalSupply()-1;
        emit TokenMinted(address(c), tx.origin, tokenId, c.tokenURI(tokenId));
    }
}


