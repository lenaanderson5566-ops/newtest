export const formatWalletAmount = (rawBalance) => {
  const numeric = Number(rawBalance || 0);
  if (!Number.isFinite(numeric)) return '0.00';
  return (numeric / 100).toFixed(2);
};

export const normalizeWalletItems = (wallets) => {
  if (!Array.isArray(wallets)) return [];

  return wallets
    .filter((wallet) => wallet && wallet.currency)
    .map((wallet) => ({
      currency: String(wallet.currency).toUpperCase(),
      amount: formatWalletAmount(wallet.balance),
    }));
};
