// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const SimpleVaultModule = buildModule("SimpleVaultModule", (m) => {
  const simpleVault = m.contract("SimpleVault");

  return { simpleVault };
});

export default SimpleVaultModule;
