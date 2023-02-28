//  SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

// Libraries are similar to contracts, but you can't declare any state variable and you can't send ether.
// A library is embedded into the contract if all library functions are internal.

library PriceConverter {
    function getPrice(
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        // ABI
        // Address 0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        // );
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return uint256(price * 1e10); // 1 * 10 == 10000000000
    }


    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        uint256 ethPrice = getPrice(priceFeed);
        // 3000_000000000000000000 ETH / USD price
        // 1_000000000000000000
        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18; // without division it will have 36 zeros at the end
        return ethAmountInUsd;
    }
}
