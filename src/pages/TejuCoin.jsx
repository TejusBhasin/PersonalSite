import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, CircleDollarSign, Coins, ExternalLink, ShieldCheck, Wallet } from "lucide-react";

const BASE_SEPOLIA = {
  chainId: "0x14a34",
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};
const EXPLORER = "https://sepolia.basescan.org";
const TOKEN_ADDRESS = import.meta.env.VITE_TEJUCOIN_ADDRESS || "";
const BALANCE_OF_SELECTOR = "0x70a08231";

function shortAddress(value) {
  return value ? value.slice(0, 6) + "…" + value.slice(-4) : "";
}

function formatTokenBalance(hex) {
  const raw = BigInt(hex || "0x0");
  const whole = raw / 10n ** 18n;
  const fraction = (raw % 10n ** 18n).toString().padStart(18, "0").slice(0, 4);
  return `${whole.toLocaleString()}.${fraction}`;
}

export default function TejuCoin() {
  const [wallet, setWallet] = useState("");
  const [chainId, setChainId] = useState("");
  const [balance, setBalance] = useState(null);
  const [message, setMessage] = useState("");
  const provider = typeof window !== "undefined" ? window.ethereum : null;
  const onBaseSepolia = chainId === BASE_SEPOLIA.chainId;

  const readBalance = useCallback(async (address, ethereum = provider) => {
    if (!address || !TOKEN_ADDRESS || !ethereum) {
      setBalance(null);
      return;
    }
    try {
      const paddedAddress = address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
      const result = await ethereum.request({
        method: "eth_call",
        params: [{ to: TOKEN_ADDRESS, data: BALANCE_OF_SELECTOR + paddedAddress }, "latest"],
      });
      setBalance(formatTokenBalance(result));
    } catch {
      setBalance(null);
    }
  }, [provider]);

  useEffect(() => {
    if (!provider) return undefined;
    provider.request({ method: "eth_accounts" }).then((accounts) => {
      if (accounts?.[0]) setWallet(accounts[0]);
    }).catch(() => {});
    provider.request({ method: "eth_chainId" }).then(setChainId).catch(() => {});
    const onAccounts = (accounts) => setWallet(accounts?.[0] || "");
    const onChain = (chain) => setChainId(chain);
    provider.on?.("accountsChanged", onAccounts);
    provider.on?.("chainChanged", onChain);
    return () => {
      provider.removeListener?.("accountsChanged", onAccounts);
      provider.removeListener?.("chainChanged", onChain);
    };
  }, [provider]);

  useEffect(() => { readBalance(wallet); }, [wallet, chainId, readBalance]);

  async function connectWallet() {
    if (!provider) {
      setMessage("Install a compatible wallet such as Coinbase Wallet or MetaMask, then try again.");
      return;
    }
    try {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      setWallet(accounts?.[0] || "");
      setChainId(await provider.request({ method: "eth_chainId" }));
      setMessage("");
    } catch (error) {
      setMessage(error?.code === 4001 ? "Wallet connection was declined." : "Could not connect to the wallet. Please try again.");
    }
  }

  async function switchNetwork() {
    if (!provider) return;
    try {
      await provider.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_SEPOLIA.chainId }] });
    } catch (error) {
      if (error?.code === 4902) {
        await provider.request({ method: "wallet_addEthereumChain", params: [BASE_SEPOLIA] });
      } else if (error?.code !== 4001) {
        setMessage("Could not switch networks. Check your wallet and try again.");
      }
    }
  }

  return (
    <div className="min-h-[75vh] bg-slate-950 text-white">
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-sm text-slate-400 hover:text-white">← Back to TejusBhasin.info</a>
          <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold tracking-wide text-amber-200">TESTNET PREVIEW · NOT A LIVE TOKEN</span>
        </div>

        <div className="grid gap-12 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300">
              <Coins className="h-4 w-4 text-cyan-300" /> Built for Base
            </div>
            <h1 className="max-w-2xl text-5xl font-black tracking-tight sm:text-7xl">Teju<span className="text-cyan-300">Coin</span></h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">A community token experience, designed to live at <span className="font-semibold text-white">tejusbhasin.info/teju</span>.</p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">This preview only connects a wallet and reads a configured Base Sepolia token balance. It does not send transactions or award tokens.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {!wallet ? (
                <button onClick={connectWallet} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-200">
                  <Wallet className="h-4 w-4" /> Connect wallet
                </button>
              ) : (
                <button onClick={onBaseSepolia ? () => readBalance(wallet) : switchNetwork} className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 font-bold text-slate-950 transition hover:bg-cyan-200">
                  {onBaseSepolia ? <><Wallet className="h-4 w-4" /> {shortAddress(wallet)} · Refresh</> : <>Switch to Base Sepolia <ArrowUpRight className="h-4 w-4" /></>}
                </button>
              )}
              <a href={EXPLORER} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 font-semibold text-slate-200 transition hover:bg-white/5">
                Base Sepolia explorer <ExternalLink className="h-4 w-4" />
              </a>
            </div>
            {message && <p role="status" className="mt-4 text-sm text-amber-200">{message}</p>}
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-900/60 p-6 shadow-2xl shadow-cyan-950/30 sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-200"><CircleDollarSign className="h-6 w-6" /></div>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">{wallet ? (onBaseSepolia ? "Base Sepolia" : "Wrong network") : "Wallet not connected"}</span>
            </div>
            <p className="mt-8 text-sm text-slate-400">TEJU balance</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">{balance ?? "—"} <span className="text-base font-semibold text-slate-400">TEJU</span></p>
            <div className="mt-6 border-t border-white/10 pt-5 text-sm text-slate-400">
              {TOKEN_ADDRESS ? "Balance is read directly from the configured Base Sepolia contract." : "Token contract is not configured yet."}
            </div>
            {TOKEN_ADDRESS && <a className="mt-4 inline-flex items-center gap-1 text-sm text-cyan-200 hover:text-cyan-100" href={`${EXPLORER}/address/${TOKEN_ADDRESS}`} target="_blank" rel="noreferrer">View token contract <ExternalLink className="h-3.5 w-3.5" /></a>}
          </div>
        </div>

        <div className="mt-16 grid gap-4 md:grid-cols-3">
          {[
            { icon: Wallet, title: "Your wallet", body: "Connect an existing wallet to see its address and, once configured, its testnet TEJU balance." },
            { icon: ShieldCheck, title: "Rewards", body: "Reward rules and verified server-side eligibility are not configured yet. No reward claims are enabled." },
            { icon: Coins, title: "Token rules", body: "Creator-only minting on transfer shortfall can create uncapped supply. The economics and limits must be explicitly set before token use." },
          ].map(({ icon: Icon, title, body }) => (
            <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <Icon className="h-5 w-5 text-cyan-200" />
              <h2 className="mt-4 font-bold">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
            </article>
          ))}
        </div>
        <p className="mt-10 text-xs leading-5 text-slate-500">Test network only. No investment value is represented. The token contract, reward backend, sponsored transactions, and audit are not deployed or active.</p>
      </section>
    </div>
  );
}
