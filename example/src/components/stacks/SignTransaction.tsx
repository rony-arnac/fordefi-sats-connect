import { Button, Card, Stack, Switch } from '@mantine/core';
import { BitcoinNetworkType } from '@sats-connect/core';
import {
  PostConditionMode,
  StacksTransactionWire,
  makeUnsignedContractCall,
  makeUnsignedContractDeploy,
  makeUnsignedSTXTokenTransfer,
  uintCV,
} from '@stacks/transactions';
import { useState } from 'react';
import Wallet from 'sats-connect';

const codeBody = `
(define-data-var greeting (string-ascii 100) "Hello, World!")

(define-read-only (get-greeting)
  (ok (var-get greeting))
)

(define-public (set-greeting (new-greeting (string-ascii 100)))
  (begin
    (var-set greeting new-greeting)
    (ok new-greeting))
)
`;

const errorMessage = 'Error signing transaction. Check console for error logs.';

interface Props {
  network: BitcoinNetworkType; // TODO handle networks
  publicKey: string;
}

export function SignTransaction({ publicKey }: Props) {
  const [broadcast, setBroadcast] = useState(false);
  const [postConditionMode, setPostConditionMode] = useState<PostConditionMode>(
    PostConditionMode.Deny,
  );
  const [addPostConditions, setAddPostConditions] = useState(false);

  const requestSignTransaction = async (transaction: StacksTransactionWire) => {
    try {
      const response = await Wallet.request('stx_signTransaction', {
        transaction: transaction.serialize(),
        broadcast,
      });
      if (response.status === 'success') {
        alert('Success! Check console for result.');
        console.log(response.result.transaction);
      } else {
        alert('Error signing transaction. Check console for error logs');
        console.error(response.error);
      }
    } catch (error) {
      alert(errorMessage);
      console.error(error);
    }
  };

  function handleSignTransactionContractCallClick() {
    const postConditionAddress = 'SP2FFKDKR122BZWS7GDPFWC0J0FK4WMW5NPQ0Z21M';

    makeUnsignedContractCall({
      fee: 3000,
      contractAddress: 'SP21YTSM60CAY6D011EZVEVNKXVW8FVZE198XEFFP',
      contractName: 'pox-fast-pool-v2',
      functionName: 'set-stx-buffer',
      functionArgs: [uintCV(1)],
      postConditionMode,
      postConditions: addPostConditions
        ? [
            {
              type: 'stx-postcondition',
              address: postConditionAddress,
              condition: 'gt',
              amount: 1000,
            },
            {
              type: 'ft-postcondition',
              address: postConditionAddress,
              asset: 'SP102V8P0F7JX67ARQ77WEA3D3CFB5XW39REDT0AM.token-alex::token-alex',
              condition: 'eq',
              amount: 1000,
            },
            {
              type: 'nft-postcondition',
              address: postConditionAddress,
              asset: 'SP217KARG4JGPMTEFT1PXC6T94E485EXQRSJQD3YC.StacksDao::stacksdao',
              assetId: uintCV(19),
              condition: 'sent',
            },
            {
              type: 'nft-postcondition',
              address: postConditionAddress,
              asset: 'SP1C2K603TGWJGKPT2Z3WWHA0ARM66D352385TTWH.welsh-punk::welsh-punk',
              assetId: uintCV(160),
              condition: 'not-sent',
            },
          ]
        : undefined,
      publicKey,
    })
      .then((transaction) => {
        return requestSignTransaction(transaction);
      })
      .catch(console.error);
  }

  function handleSignTransactionSTXTokenTransferClick() {
    makeUnsignedSTXTokenTransfer({
      fee: 3000,
      recipient: 'SP2FFKDKR122BZWS7GDPFWC0J0FK4WMW5NPQ0Z21M', // account 4
      amount: 1000,
      publicKey,
    })
      .then((transaction) => {
        return requestSignTransaction(transaction);
      })
      .catch(console.error);
  }

  function handleSignTransactionContractDeployClick() {
    makeUnsignedContractDeploy({
      contractName: 'my-contract',
      codeBody,
      fee: 3000,
      postConditionMode,
      publicKey,
    })
      .then((transaction) => {
        return requestSignTransaction(transaction);
      })
      .catch(console.error);
  }

  return (
    <Card>
      <h3>Sign transaction</h3>
      <Stack>
        <Switch
          checked={broadcast}
          onChange={() => setBroadcast((prev) => !prev)}
          label={`Broadcast: ${broadcast ? 'True' : 'False'}`}
        />
        <Switch
          checked={postConditionMode === PostConditionMode.Allow}
          onChange={() =>
            setPostConditionMode((prev) =>
              prev === PostConditionMode.Allow ? PostConditionMode.Deny : PostConditionMode.Allow,
            )
          }
          label={`Post condition mode: ${
            postConditionMode === PostConditionMode.Allow ? 'Allow' : 'Deny'
          } `}
        />
        <Switch
          checked={addPostConditions}
          onChange={() => setAddPostConditions((prev) => !prev)}
          label={addPostConditions ? 'Add post conditions' : 'No post conditions'}
        />
        <Button onClick={handleSignTransactionSTXTokenTransferClick}>
          Sign Transaction (token transfer)
        </Button>
        <Button onClick={handleSignTransactionContractCallClick}>
          Sign Transaction (contract call)
        </Button>
        <Button onClick={handleSignTransactionContractDeployClick}>
          Sign Transaction (contract deploy)
        </Button>
      </Stack>
    </Card>
  );
}
