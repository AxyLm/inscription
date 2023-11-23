"use client";
import classNames from "classnames";
import Head from "next/head";
import Link from "next/link";
import { useCallback, useState } from "react";
import {
  Chain,
  HDAccount,
  Hex,
  PrivateKeyAccount,
  createWalletClient,
  http,
  isAddress,
  stringToHex,
} from "viem";
import { privateKeyToAccount, mnemonicToAccount } from "viem/accounts";
import {
  avalanche,
  bsc,
  mainnet,
  polygon,
  base,
  arbitrum,
  zkSync,
  linea,
  okc,
  fantom,
  opBNB,
  celo,
} from "viem/chains";

const chains = {
  eth: mainnet,
  bsc,
  polygon,
  avalanche,
  base,
  arbitrum,
  zkSync,
  linea,
  okc,
  fantom,
  opBNB,
  celo,
};

type ChainKey = keyof typeof chains;

const example =
  'data:,{"p":"asc-20","op":"mint","tick":"aval","amt":"100000000"}';

type Log = SuccessLog | ErrorLog;
interface SuccessLog {
  state: string;
  time: Date;
  hash: Hex;
  owner: Hex;
  to: Hex;
}
interface ErrorLog {
  log: string;
  state: string;
  time: Date;
}

function isSuccessLog(log: Log): log is SuccessLog {
  return log.state === "success";
}
function isErrorLog(log: Log): log is ErrorLog {
  return log.state === "error";
}
export default function Home() {
  const [accounts, setAccounts] = useState<(PrivateKeyAccount | HDAccount)[]>([]);
  const [toAddress, setToAddress] = useState<Hex>();
  const [inscription, setInscription] = useState<string>("");
  const [logs, setLogs] = useState<Log[]>([]);
  const [running, setRunning] = useState<boolean>(false);
  const [timer, setTimer] = useState<NodeJS.Timeout>();
  const [rpc, setRpc] = useState<string>();
  const [intervalTime, setIntervalTime] = useState<number>(1000);
  const [chain, setChain] = useState<Chain>(mainnet);

  const handleAddress = (address: Hex) => {
    const prefix = address.slice(0, 6);
    const suffix = address.slice(-4);
    return `${prefix}...${suffix}`;
  };

  const run = useCallback(() => {
    if (accounts.length === 0) {
      setLogs((logs) => [{
        state: 'error',
        log: '没有私钥',
        time: new Date(),
      }, ...logs]);
      setRunning(false);
      return;
    }

    if (!inscription) {
      setLogs((logs) => [{
        state: 'error',
        log: '没有铭文',
        time: new Date(),
      }, ...logs]);
      setRunning(false);
      return;
    }

    const client = createWalletClient({
      chain,
      transport: http(rpc),
    });

    const timer = setInterval(async () => {
      for (const account of accounts) {
        try {
          const hash = await client.sendTransaction({
            account,
            to: toAddress ?? account.address,
            value: 0n,
            data: stringToHex(inscription),
          });
          setLogs((logs) => [
            {
              state: "success",
              time: new Date(),
              hash,
              owner: (account.address),
              to: toAddress ?? account.address,
            },
            ...logs,
          ]);
        } catch (error) {
          console.error(error);
          setLogs((logs) => [
            {
              state: "error",
              log: `${handleAddress(account.address)} ${error}`,
              time: new Date(),
            },
            ...logs,
          ]);
        }
      }
    }, intervalTime);
    setTimer(timer);
  }, [accounts, chain, inscription, intervalTime, rpc, toAddress]);


  return (
    <>
      <Head>
        <title>{chain.name}</title>
      </Head>
      <main className=" flex flex-col items-center gap-5 py-5">
        
        <h1 className=" text-5xl">Inscription</h1>

        <div className=" flex items-center justify-center gap-5">
          <select
            className=" h-10 w-[200px] rounded-lg border px-2"
            disabled={running}
            onChange={(e) => {
              const text = e.target.value as ChainKey;
              setChain(chains[text]);
            }}
            title="Select Chain"
          >
            {Object.keys(chains).map((key) => (
              <option
                key={key}
                value={key}
              >
                {chains[key as ChainKey].name}
              </option>
            ))}
          </select>
          {
            chain.blockExplorers && <Link className=" text-blue-500 hover:underline mr-2" href={chain.blockExplorers?.default.url} target="_blank">
              {chain.blockExplorers.default.name}
            </Link>
          }
        </div>

        <div className=" flex flex-col gap-2">
          <span>私钥/助记词(每行一个):</span>
          <textarea
            className="h-[100px] w-[800px] rounded-lg border p-2"
            placeholder="私钥/助记词"
            disabled={running}
            onChange={(e) => {
              const text = e.target.value;
              const lines = text.split("\n");
              const accounts = lines.map((line) => {
                try {
                  if (/^0x[a-fA-F0-9]{64}$/.test(line)) {
                    return privateKeyToAccount(line as Hex);
                  } else {
                    return mnemonicToAccount(line);
                  }
                } catch (error) {
                  return undefined
                }
              });
              setAccounts(accounts.filter((x) => x) as (PrivateKeyAccount | HDAccount)[]);
            }}
          />
        </div>

        <div className=" flex flex-col gap-2">
          <span>to:</span>
          <input
            className=" h-10 w-[800px] rounded-lg border px-2"
            placeholder="地址"
            disabled={running}
            onChange={(e) => {
              const text = e.target.value;
              isAddress(text) && setToAddress(text);
            }}
          />
        </div>

        <div className=" flex flex-col gap-2">
          <span>rpc:</span>
          <input
            className=" h-10 w-[800px] rounded-lg border px-2"
            placeholder="rpc"
            disabled={running}
            onChange={(e) => {
              const text = e.target.value;
              setRpc(text);
            }}
          />
        </div>

        <div className=" flex flex-col gap-2">
          <span>要打的铭文（原始铭文，不是转码后的十六进制）:</span>
          <textarea
            className=" h-[100px] w-[800px] rounded-lg border p-2"
            placeholder={`铭文，不要输入错了，自己多检查下，例子：\n${example}`}
            disabled={running}
            onChange={(e) => {
              const text = e.target.value;
              setInscription(text.trim());
            }}
          />
        </div>

        <div className=" flex items-center justify-center gap-5">
          <button
            className={classNames(
              " h-10 w-[200px] rounded-full text-white transition-all hover:opacity-80",
              running ? " bg-red-600" : " bg-green-600",
            )}
            onClick={() => {
              if (!running) {
                setRunning(true);
                run();
              } else {
                setRunning(false);
                timer && clearInterval(timer);
              }
            }}
          >
            {running ? "运行中" : "运行"}
          </button>

          <input
            className=" h-10 w-[400px] rounded-lg border px-2"
            placeholder="间隔时间（默认 1000ms）"
            type="number"
            disabled={running}
            onChange={(e) => {
              const text = e.target.value;
              setIntervalTime(Number(text));
            }}
          />
        </div>

        <div className="mt-5 flex w-[1000px] flex-col gap-2">
          <span>
            {`hash count: ${logs.filter((log) => log.state === 'success').length}`}
          </span>
          <p>
          </p>
          <div className=" flex h-[600px] flex-col gap-1 overflow-auto rounded-lg bg-gray-100 px-4 py-2">
            {logs.filter((_, i) => i <= 200).map((log, index) => (
              <div
                key={log.time.toString() + index}
                className=" flex items-center"
              >
                <span className=" mr-2">
                  {log.time.toLocaleTimeString()}
                </span>
                {isSuccessLog(log) && (
                  <>
                    <Link className=" text-blue-500 hover:underline mr-2" href={chain.blockExplorers?.default.url + '/address/' + log.owner} target="_blank">{handleAddress(log.owner)}</Link>
                    <Link className=" text-blue-500 hover:underline mr-2" href={chain.blockExplorers?.default.url + '/address/' + log.to} target="_blank">{handleAddress(log.to)}</Link>
                    <Link className=" text-blue-500 hover:underline" href={chain.blockExplorers?.default.url + '/tx/' + log.hash} target="_blank">{chain.name } {log.hash}</Link>
                  </>
                )}
                {
                  isErrorLog(log) && (
                    <span className=" text-red-500 mr-2">{log.log}</span>
                  )
                }
              </div>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
