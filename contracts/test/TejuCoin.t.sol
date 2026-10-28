// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../src/TejuCoin.sol";

contract TejuCoinReceiver {
    function send(TejuCoin token, address to, uint256 amount) external {
        token.transfer(to, amount);
    }
}

contract TejuCoinTest {
    function testCreatorTransferMintsOnlyShortfall() external {
        TejuCoin token = new TejuCoin();
        TejuCoinReceiver recipient = new TejuCoinReceiver();
        uint256 amount = 75 ether;

        require(token.creator() == address(this), "test contract should be creator");
        require(token.totalSupply() == 0, "initial supply should be zero");
        require(token.transfer(address(recipient), amount), "creator transfer failed");
        require(token.totalSupply() == amount, "should mint exact shortfall");
        require(token.balanceOf(address(recipient)) == amount, "recipient balance incorrect");
        require(token.balanceOf(address(this)) == 0, "creator should transfer all minted shortfall");
    }

    function testOrdinaryHolderCanTransferWithoutMinting() external {
        TejuCoin token = new TejuCoin();
        TejuCoinReceiver holder = new TejuCoinReceiver();
        TejuCoinReceiver recipient = new TejuCoinReceiver();

        token.transfer(address(holder), 10 ether);
        uint256 supplyBefore = token.totalSupply();
        holder.send(token, address(recipient), 4 ether);

        require(token.totalSupply() == supplyBefore, "ordinary transfer must not mint");
        require(token.balanceOf(address(holder)) == 6 ether, "holder balance incorrect");
        require(token.balanceOf(address(recipient)) == 4 ether, "recipient balance incorrect");
    }

    function testOrdinaryHolderCannotMintShortfall() external {
        TejuCoin token = new TejuCoin();
        TejuCoinReceiver holder = new TejuCoinReceiver();
        TejuCoinReceiver recipient = new TejuCoinReceiver();
        uint256 supplyBefore = token.totalSupply();

        (bool success,) = address(holder).call(
            abi.encodeCall(holder.send, (token, address(recipient), 1 ether))
        );

        require(!success, "ordinary holder must not mint on shortfall");
        require(token.totalSupply() == supplyBefore, "failed transfer changed supply");
        require(token.balanceOf(address(recipient)) == 0, "failed transfer changed recipient balance");
    }

    function testCreatorShortfallAccessDoesNotExtendToHolder() external {
        TejuCoin token = new TejuCoin();
        TejuCoinReceiver holder = new TejuCoinReceiver();
        TejuCoinReceiver recipient = new TejuCoinReceiver();

        token.transfer(address(holder), 2 ether);
        (bool success,) = address(holder).call(
            abi.encodeCall(holder.send, (token, address(recipient), 3 ether))
        );

        require(!success, "holder must not mint on transfer shortfall");
        require(token.totalSupply() == 2 ether, "failed holder transfer changed supply");
    }
}
