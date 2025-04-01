// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const V2_StakeModule = buildModule("V2_StakeModule", (m) => {
  const v2_Stake = m.contract("V2_Stake");

  return { v2_Stake };
});

export default V2_StakeModule;
