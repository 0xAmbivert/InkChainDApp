// No imports needed - loaded via CDN in index.html
const { useState, useEffect } = React;

// --- CONFIGURATION ---
const INK_CONFIG = {
  chainId: "0xdef1", // 57073 in hex
  chainName: "Ink",
  rpcUrls: ["https://rpc.inkonchain.com"],
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  blockExplorerUrls: ["https://explorer.inkonchain.com"],
};

const WETH_ABI = [
  "function deposit() public payable",
  "function withdraw(uint256 wad) public",
  "function balanceOf(address owner) view returns (uint256)"
];

const WETH_ADDRESS = "0x4200000000000000000000000000000000000006";

export default function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState("0");
  const [status, setStatus] = useState({ type: 'info', msg: 'Welcome to Ink' });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('transfer');
  const [ethersLib, setEthersLib] = useState(null);

  // Input States
  const [txTarget, setTxTarget] = useState('');
  const [txAmount, setTxAmount] = useState('');

  // Load Ethers and handle Lucide initialization
  useEffect(() => {
    // Load Ethers UMD
    const script = document.createElement('script');
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.2/ethers.umd.min.js";
    script.async = true;
    script.onload = () => {
      setEthersLib(window.ethers);
    };
    document.body.appendChild(script);

    // Initial Lucide check
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, []);

  // Re-run icon replacement when tab changes
  useEffect(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, [activeTab, account]);

  const notify = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus({ type: 'info', msg: 'Ink Mainnet Active' }), 5000);
  };

  const connectWallet = async () => {
    if (!window.ethereum) return notify('error', 'Please install MetaMask');
    if (!ethersLib) return notify('error', 'Ethers library not loaded yet');
    
    setLoading(true);
    try {
      const provider = new ethersLib.BrowserProvider(window.ethereum);
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: INK_CONFIG.chainId }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [INK_CONFIG],
          });
        }
      }

      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const bal = await provider.getBalance(address);
      
      setAccount(address);
      setBalance(ethersLib.formatEther(bal));
      notify('success', 'Connected to InkChain');
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendEth = async () => {
    if (!txTarget || !txAmount) return notify('error', 'Fill all fields');
    if (!ethersLib) return;
    setLoading(true);
    try {
      const provider = new ethersLib.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: txTarget,
        value: ethersLib.parseEther(txAmount)
      });
      notify('info', 'Tx Broadcasted...');
      await tx.wait();
      notify('success', 'Transaction Confirmed!');
      const bal = await provider.getBalance(account);
      setBalance(ethersLib.formatEther(bal));
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const wrapEth = async () => {
    if (!txAmount || !ethersLib) return notify('error', 'Enter amount');
    setLoading(true);
    try {
      const provider = new ethersLib.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethersLib.Contract(WETH_ADDRESS, WETH_ABI, signer);
      const tx = await contract.deposit({ value: ethersLib.parseEther(txAmount) });
      notify('info', 'Wrapping ETH...');
      await tx.wait();
      notify('success', 'ETH successfully wrapped');
      const bal = await provider.getBalance(account);
      setBalance(ethersLib.formatEther(bal));
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const unwrapEth = async () => {
    if (!txAmount || !ethersLib) return notify('error', 'Enter amount');
    setLoading(true);
    try {
      const provider = new ethersLib.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethersLib.Contract(WETH_ADDRESS, WETH_ABI, signer);
      const tx = await contract.withdraw(ethersLib.parseEther(txAmount));
      notify('info', 'Unwrapping WETH...');
      await tx.wait();
      notify('success', 'WETH successfully unwrapped');
      const bal = await provider.getBalance(account);
      setBalance(ethersLib.formatEther(bal));
    } catch (err) {
      notify('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  // UI Components
  const NavItem = ({ id, icon, label }) => (
    <button 
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 ${
        activeTab === id ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/40' : 'text-slate-400 hover:bg-white/5 hover:text-white'
      }`}
    >
      <i data-lucide={icon} className="w-4 h-4"></i>
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 font-sans">
      {/* Header */}
      <nav className="border-b border-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-xl flex items-center justify-center">
              <i data-lucide="zap" className="text-white fill-white w-5 h-5"></i>
            </div>
            <span className="text-xl font-bold tracking-tight">INK<span className="text-purple-500 font-black">CORE</span></span>
          </div>

          <div className="flex items-center gap-4">
            {account ? (
              <div className="flex items-center gap-3 bg-white/5 p-1 pr-4 rounded-full border border-white/10">
                <div className="bg-purple-600 px-3 py-1.5 rounded-full text-sm font-bold shadow-inner">
                  {parseFloat(balance).toFixed(4)} ETH
                </div>
                <span className="text-sm font-mono text-slate-300">
                  {account.slice(0,6)}...{account.slice(-4)}
                </span>
              </div>
            ) : (
              <button 
                onClick={connectWallet}
                className="bg-white text-black px-6 py-2.5 rounded-full font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
              >
                <i data-lucide="wallet" className="w-4 h-4"></i>
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Status Bar */}
        <div className={`mb-8 p-4 rounded-2xl border flex items-center gap-3 transition-all duration-500 ${
          status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
          status.type === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
          'bg-white/5 border-white/10 text-slate-400'
        }`}>
          <i data-lucide={status.type === 'error' ? "shield-alert" : "activity"} className="w-5 h-5"></i>
          <p className="text-sm font-semibold tracking-wide">{status.msg}</p>
        </div>

        {/* Navigation */}
        <div className="flex gap-2 mb-10 bg-white/5 p-1.5 rounded-2xl border border-white/5 w-fit">
          <NavItem id="transfer" icon="send" label="Transfer" />
          <NavItem id="contracts" icon="coins" label="Wrap/Unwrap" />
          <NavItem id="history" icon="refresh-ccw" label="Activity" />
        </div>

        {/* Content Area */}
        <div className="grid gap-8">
          {activeTab === 'transfer' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <i data-lucide="send" className="w-32 h-32"></i>
              </div>
              <h2 className="text-2xl font-black mb-2 uppercase">Native Transfer</h2>
              <p className="text-slate-400 mb-8 text-sm">Send ETH instantly across the Ink network.</p>
              
              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-tighter">Recipient Address</label>
                  <input 
                    type="text"
                    placeholder="0x..."
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500 outline-none transition-all font-mono text-sm"
                    value={txTarget}
                    onChange={(e) => setTxTarget(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-tighter">Amount (ETH)</label>
                  <input 
                    type="number"
                    placeholder="0.0"
                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-5 py-4 focus:border-purple-500 outline-none transition-all font-bold"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                  />
                </div>

                <button 
                  onClick={handleSendEth}
                  disabled={loading || !account || !ethersLib}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 py-5 rounded-2xl font-black text-white hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Execute Transaction'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-purple-500/50 transition-all">
                <i data-lucide="lock" className="text-purple-500 mb-4 w-8 h-8"></i>
                <h3 className="text-xl font-black mb-2 uppercase">Wrap ETH</h3>
                <p className="text-slate-400 text-sm mb-6">Convert Native ETH to WETH.</p>
                <input 
                  type="number"
                  placeholder="0.0 ETH"
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm mb-4 outline-none"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={wrapEth} disabled={loading || !account} className="bg-white text-black py-3 rounded-xl font-black text-xs uppercase">Wrap</button>
                  <button onClick={unwrapEth} disabled={loading || !account} className="border border-white/10 py-3 rounded-xl font-black text-xs uppercase">Unwrap</button>
                </div>
              </div>
              
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
                <i data-lucide="zap" className="text-blue-500 mb-4 w-8 h-8"></i>
                <h3 className="text-xl font-black mb-2 uppercase">Gas Check</h3>
                <p className="text-slate-400 text-sm mb-6">Self-ping to test network speed.</p>
                <button 
                  onClick={async () => {
                    if (!ethersLib) return;
                    setLoading(true);
                    try {
                      const signer = await (new ethersLib.BrowserProvider(window.ethereum)).getSigner();
                      const tx = await signer.sendTransaction({ to: account, value: 0 });
                      await tx.wait();
                      notify('success', 'Ping Successful');
                    } catch (e) { notify('error', e.message); } finally { setLoading(false); }
                  }}
                  disabled={!account || loading}
                  className="w-full bg-blue-600/10 border border-blue-500/20 text-blue-400 py-4 rounded-xl font-black text-xs uppercase hover:bg-blue-600 hover:text-white transition-all"
                >
                  Ping Network
                </button>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black uppercase tracking-tight">Activity</h2>
                <a href={INK_CONFIG.blockExplorerUrls[0]} target="_blank" className="text-[10px] font-black uppercase text-purple-400 flex items-center gap-2">
                  Explorer <i data-lucide="external-link" className="w-3 h-3"></i>
                </a>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex items-center justify-between p-5 rounded-2xl bg-black/40 border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                        <i data-lucide="arrow-up-right" className="w-4 h-4"></i>
                      </div>
                      <div>
                        <p className="text-sm font-black uppercase">Transaction #{i}</p>
                        <p className="text-[10px] text-slate-500 font-mono">Ink Mainnet Node</p>
                      </div>
                    </div>
                    <p className="text-sm font-black text-purple-400">SUCCESS</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}