"use client";
import {
  StellarWalletsKit,
  WalletNetwork,
  XBULL_ID,
  xBullModule,
  FreighterModule,
  AlbedoModule,
} from "@creit.tech/stellar-wallets-kit";
const StellarSdk = require("@stellar/stellar-sdk");
const { Horizon } = require("stellar-sdk")
// import ButtonComponent from "attestellar-sdk/src/ButtonComponent";
export default function ConnectButton(amt) {
    console.log(amt.amt)
  const kit = new StellarWalletsKit({
    selectedWalletId: XBULL_ID,
    network: WalletNetwork.TESTNET,
    modules: [new xBullModule(), new FreighterModule(), new AlbedoModule()],
  });

  const handleWalletSelection = async (option) => {
    if (!option.isAvailable) {
      // TODO: Show error
      return;
    }

    kit.setWallet(option.id);

    const publicKey = await kit.getPublicKey();

    try {
      const server = new Horizon.Server(
        "https://horizon-testnet.stellar.org",
      );

      // TODO: Check if account activated
      const account = await server.loadAccount(publicKey);

      // TODO: Put server wallet address in env
      const transaction = new StellarSdk.TransactionBuilder(account, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination:
              "GCYJ5XLM657DPDLCDSBNNOBTS33LKIT5INYHAJH5HWXEIEDMAQDEPIWN",
            asset: StellarSdk.Asset.native(),
            amount: amt.amt,
          }),
        )
        .addMemo(StellarSdk.Memo.text("Deposit"))
        .setTimeout(60)
        .build();

      const { result: signedTxnXdr } = await kit.signTx({
        xdr: transaction.toXDR(),
        publicKeys: [publicKey],
        network: WalletNetwork.TESTNET,
      });

      const signedTxn = new StellarSdk.Transaction(
        signedTxnXdr,
        StellarSdk.Networks.TESTNET,
      );

      const txnResult = await server.submitTransaction(signedTxn, {
        skipMemoRequiredCheck: true,
      });

      // TODO: Pass txHash to the backend and verify data on-chain

      return txnResult.successful;
    } catch (error) {
      console.error(`Error depositing funds - ${error?.message}`);

      return false;
    }
  };

  const openModal = async () => {
    await kit.openModal({
      onWalletSelected: (option) => {
        void handleWalletSelection(option);
      },
    });
  };

  return (
    <main className="bg-gradient-to-btext-white flex flex-col items-center justify-center">
      <button onClick={openModal}>Send Paymen</button>
    </main>
  );
}
