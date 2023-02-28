// import
// main function
// calling of main function

const { networkConfig, developmentChains } = require("../helper-hardhat-config");
const {network} = require("hardhat");
const { verify } = require("../utils/verify");
require("dotenv").config();


// function deployFunc() {
//     console.log("hi!");
// }
// module.exports.default = deployFunc;

// Another method
// module.exports = async (hre) => {
//     const {getNamedAccounts, deployments} = hre;
//     //// hre.getNamedAccounts
//     //// hre.deployments
// }

// can work with any one!
module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  let ethUsdPriceFeedAddress
  if (chainId == 31337) {
      const ethUsdAggregator = await deployments.get("MockV3Aggregator")
      ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
      ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
  }
  log("----------------------------------------------------")
  log("Deploying FundMe and waiting for confirmations...")
  // The idea of mock contract here is:
  // if the contract doesn't exist, we deploy a minimal version of it 
  // for our local testing
  // and deploying mock is technically a deploying script

  // when going for localhost or hardhat network we want to use a mock
  //const args = ethUsdPriceFeedAddress;
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress],
    log: true,
    // we need to wait if on a live network so we can verify properly
    waitConfirmations: network.config.blockConfirmations || 1,
})
log(`FundMe deployed at ${fundMe.address}`)

if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress])
    log("verified!")
}
}

module.exports.tags = ["all", "fundme"]
