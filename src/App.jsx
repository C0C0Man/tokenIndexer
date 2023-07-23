import {
  Box,
  Button,
  Center,
  Flex,
  Heading,
  Image,
  Input,
  SimpleGrid,
  Spinner,
  Text,
} from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState, useEffect } from 'react';
import { MetaMaskSDK } from '@metamask/sdk';
import { ethers } from 'ethers';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [results, setResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [tokenDataObjects, setTokenDataObjects] = useState([]);
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  async function checkWalletConnection() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setIsWalletConnected(true);
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsWalletConnected(true);
      } catch (error) {
        console.error(error);
      }
    }
  }

  const [isLoading, setIsLoading] = useState(false);

  async function getTokenBalance() {

    let addressToUse = userAddress;

    if (!isWalletConnected && !userAddress) {
      console.error('Please provide an address or connect your wallet.');
      return;
    }
   
    if (isWalletConnected && !userAddress) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        addressToUse = accounts[0];
      }
    }

    const isENSName = /^([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/.test(
      addressToUse
    );

    if (isENSName) {
      try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const resolvedAddress = await provider.resolveName(addressToUse);
        addressToUse = resolvedAddress;
      } catch (error) {
        console.error('Failed to resolve ENS name:', error);
        return;
      }
    }

    const config = {
      apiKey: 'G8YH_EdJ8ArW5bB-8vU4oV3i5wFbOMZf',
      network: Network.ETH_MAINNET,
    };

    setIsLoading(true);

    const alchemy = new Alchemy(config);
    const data = await alchemy.core.getTokenBalances(addressToUse);

    setResults(data);

    const tokenDataPromises = [];

    for (let i = 0; i < data.tokenBalances.length; i++) {
      const tokenData = alchemy.core.getTokenMetadata(
        data.tokenBalances[i].contractAddress
      );
      tokenDataPromises.push(tokenData);
    }

    setTokenDataObjects(await Promise.all(tokenDataPromises));
    setHasQueried(true);
    setIsLoading(false);
  }
  return (
    <div class="hero-section">
    <Box w="100vw">
      
  <h1 class="hero-heading">Welcome to ERC-20 Token Indexer</h1>
  <p class="hero-description">
    Plug in an address and this website will return all of its ERC-20 token balances!
  </p>
  <div class="button-wrapper">
  <button
    class="hero-button"
    onClick={isWalletConnected ? getTokenBalance : connectWallet}
    disabled={isLoading}
  >
    {isLoading ? (
      <div class="button-loader">
        <Spinner size="sm" color="white" />
      </div>
    ) : (
      isWalletConnected ? 'Connected to MetaMask' : 'Connect Your Wallet'
    )}
  </button>
</div>
  

      
      <Flex
        w="100%"
        flexDirection="column"
        alignItems="center"
        justifyContent={'center'}
      >
        <Heading mt={42}>
          OR Get all the ERC-20 token balances of this address:
        </Heading>
        
        <Input
          onChange={(e) => setUserAddress(e.target.value)}
          value={userAddress}
          color="black"
          w="600px"
          textAlign="center"
          p={4}
          bgColor="white"
          fontSize={24}
          placeholder="Enter an address or connect your wallet"
        />
        <Button fontSize={20} onClick={getTokenBalance} mt={36} bgColor="blue">
          Check ERC-20 Token Balances
        </Button>

        <Heading my={36}>ERC-20 token balances:</Heading>

        {hasQueried ? (
          <SimpleGrid w={'90vw'} columns={4} spacing={24}>
            {results.tokenBalances.map((e, i) => {
              return (
                <Flex flexDir={'column'} className="token-card" key={e.id}>
                  <div className="token-symbol">{tokenDataObjects[i].symbol}</div>
                    <div className="token-balance-container">
                      <div className="token-balance">
                        {Utils.formatUnits(e.tokenBalance, tokenDataObjects[i].decimals)}
                      </div>
                  </div>
                  <Image src={tokenDataObjects[i].logo} />
                </Flex>
              );
            })}
          </SimpleGrid>
          ) : (
            'Please make a query! This may take a few seconds...'
          )}

      </Flex>
    </Box>
    </div>
  );
}

export default App;
