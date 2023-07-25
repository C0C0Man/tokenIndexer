import { Box, Button, Center, Flex, Heading, Image, Input, SimpleGrid, Spinner, Text } from '@chakra-ui/react';
import { Alchemy, Network, Utils } from 'alchemy-sdk';
import { useState, useEffect } from 'react';

function App() {
  const [userAddress, setUserAddress] = useState('');
  const [resultsERC20, setResultsERC20] = useState([]);
  const [resultsNFT, setResultsNFT] = useState([]);
  const [hasQueriedERC20, setHasQueriedERC20] = useState(false);
  const [hasQueriedNFT, setHasQueriedNFT] = useState(false);
  const [tokenDataObjectsERC20, setTokenDataObjectsERC20] = useState([]);
  const [tokenDataObjectsNFT, setTokenDataObjectsNFT] = useState([]);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkWalletConnection();
    addAccountsChangedListener();
  }, []);

  async function checkWalletConnection() {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        setIsWalletConnected(accounts.length > 0);
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          indexTokens();
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  function addAccountsChangedListener() {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setIsWalletConnected(true);
          setUserAddress(accounts[0]);
          indexTokens(); // Re-index tokens for the new account
        } else {
          setIsWalletConnected(false);
        }
      });
    }
  }

  async function connectWallet() {
    if (window.ethereum) {
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        setIsWalletConnected(true);
        indexTokens(); // Index tokens and NFTs on successful connection
      } catch (error) {
        console.error(error);
      }
    }
  }

  async function indexTokens() {
    if (!isWalletConnected && !userAddress) {
      console.error('Please provide an address or connect your wallet.');
      return;
    }

    if (isWalletConnected && !userAddress) {
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setUserAddress(accounts[0]);
      }
    }

    setIsLoading(true);

    // Index ERC-20 tokens
    const erc20Config = {
      apiKey: 'G8YH_EdJ8ArW5bB-8vU4oV3i5wFbOMZf',
      network: Network.ETH_MAINNET,
    };
    const alchemyERC20 = new Alchemy(erc20Config);
    const erc20Data = await alchemyERC20.core.getTokenBalances(userAddress);
    setResultsERC20(erc20Data);

    const erc20TokenDataPromises = erc20Data.tokenBalances.map(({ contractAddress }) => alchemyERC20.core.getTokenMetadata(contractAddress));
    setTokenDataObjectsERC20(await Promise.all(erc20TokenDataPromises));
    setHasQueriedERC20(true);

    // Index ERC-721 tokens (NFTs)
    const nftConfig = {
      apiKey: 'G8YH_EdJ8ArW5bB-8vU4oV3i5wFbOMZf',
      network: Network.ETH_MAINNET,
    };
    const alchemyNFT = new Alchemy(nftConfig);
    const nftData = await alchemyNFT.nft.getNftsForOwner(userAddress);
    setResultsNFT(nftData);

    const nftTokenDataPromises = nftData.ownedNfts.map(({ contract }) => alchemyNFT.nft.getNftMetadata(contract.address, contract.tokenId));
    setTokenDataObjectsNFT(await Promise.all(nftTokenDataPromises));
    setHasQueriedNFT(true);

    setIsLoading(false);
  }

  return (
    <div className="hero-section">
      <Box w="100vw">
        <Center>
          <Flex alignItems="center" justifyContent="center" flexDirection="column">
            <Heading mb={0} fontSize={36}>
              NFT and ERC-20 Token Indexer
            </Heading>
            <Text>
              Plug in an address or connect a wallet and this website will return all of its tokens and NFTs!
            </Text>
            <Button fontSize={20} onClick={isWalletConnected ? indexTokens : connectWallet} mt={4} bgColor={isWalletConnected ? 'green' : 'blue'}>
              {isLoading ? (
                <Spinner size="sm" color="white" />
              ) : isWalletConnected ? (
                'Connected to MetaMask'
              ) : (
                'Connect Your Wallet'
              )}
            </Button>
          </Flex>
        </Center>
        <Flex w="100%" flexDirection="column" alignItems="center" justifyContent="center">
          <Heading mt={42}>Get all the tokens and NFTs of this address:</Heading>
          <Input onChange={(e) => setUserAddress(e.target.value)} color="black" w="600px" textAlign="center" p={4} bgColor="white" fontSize={24} />
          <Button fontSize={20} onClick={indexTokens} mt={36} bgColor="blue">
            Fetch Tokens and NFTs
          </Button>

          <Heading my={36}>Here are your ERC-20 Tokens:</Heading>
          {/* Display ERC-20 token balances here */}
          {hasQueriedERC20 ? (
            <SimpleGrid w="90vw" columns={4} spacing={24}>
              {resultsERC20.tokenBalances.map((e, i) => (
                <Flex flexDir="column" className="token-card" key={e.id}>
                  <div className="token-symbol">{tokenDataObjectsERC20[i].symbol}</div>
                  <div className="token-balance-container">
                    <div className="token-balance">
                      {Utils.formatUnits(e.tokenBalance, tokenDataObjectsERC20[i].decimals)}
                    </div>
                  </div>
                  <Image src={tokenDataObjectsERC20[i].logo} />
                </Flex>
              ))}
            </SimpleGrid>
          ) : (
            'Please make a query for ERC-20 tokens! The query may take a few seconds...'
          )}

          <Heading my={36}>Here are your NFTs:</Heading>
          {/* Display ERC-721 (NFT) tokens here */}
          {hasQueriedNFT ? (
            <SimpleGrid w="90vw" columns={4} spacing={24}>
              {resultsNFT.ownedNfts.map((e, i) => (
                <Flex flexDir="column" className="token-card" color="white" bg="blue" w="20vw" key={e.id}>
                  <Box>
                    <b>Name:</b> {tokenDataObjectsNFT[i].title?.length === 0 ? 'No Name' : tokenDataObjectsNFT[i].title}
                  </Box>
                  <Image
                    src={tokenDataObjectsNFT[i]?.rawMetadata?.image ?? 'https://via.placeholder.com/200'}
                    alt="Image"
                  />
                </Flex>
              ))}
            </SimpleGrid>
          ) : (
            'Please make a query for NFTs! The query may take a few seconds...'
          )}
        </Flex>
      </Box>
    </div>
  );
}

export default App;
