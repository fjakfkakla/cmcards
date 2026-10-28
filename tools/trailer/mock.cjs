// Fake backend for capture: config, account, packs, market.
const WALLET = "CmTr4iLer5oLaNaXxQe9fW1k7pZbHnVd3sGuJyRtEaAb";
const SELLERS = ["8hKq3WnZ5xT1vYbR2cJ9mPd4LsEuA6fGoN7iXyQzVtB", "5tGw9KpQx2YzR4vN8cJm1LdS6hBfE3aUoT7iWnXyPqZ", "Ap3xK9mWq7ZtR2vY5cN8LdJ6hBfE4gUoT1iSnXyPqWe", "Fq2Zt8NwK5xR3vYm7cJ9LdP4hBsE6aUoT1iGnXyQzVb"];
let n = 0;
const card = (trader, rarity, serial, pack = "legend", owner = WALLET) => ({ id: `${trader}-${rarity}`, uid: `u${++n}-${trader}`, trader, rarity, serial, owner, pack, at: Date.now() - n * 60000 });
const state = {
  free: true,
  cards: [],
  listings: [],
  draw: [],
  offers: [],
  sales: [],
};
function setup(page, opts = {}) {
  Object.assign(state, opts);
  return page.route("**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!url.host.startsWith("localhost")) {
      if (/twimg|solana|helius/.test(url.host)) return route.abort();
      return route.continue();
    }
    const p = url.pathname;
    const json = (b) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(b) });
    if (p === "/api/config") return json({ cluster: "mainnet-beta", rpc: "http://127.0.0.1:9", treasury: "CmCards7rEaSuRy111111111111111111111111111" });
    if (p === "/api/me") return json({ wallet: state.loggedOut ? null : WALLET, cards: state.cards, listings: state.listings, sales: [], free: state.free });
    if (p === "/api/packs/open" || p === "/api/packs/free") { state.cards = [...state.draw, ...state.cards]; state.free = false; return json({ cards: state.draw }); }
    if (p === "/api/market") return json({ offers: state.offers, sales: state.sales });
    if (p === "/api/market/list") {
      const b = route.request().postDataJSON();
      const l = { id: "L" + Date.now(), uid: b.uid, seller: WALLET, lamports: Math.round(b.price * 1e9), at: Date.now() };
      state.listings.push(l);
      return json({ listing: l });
    }
    if (p.startsWith("/api/")) return json({});
    return route.continue();
  });
}
module.exports = { WALLET, SELLERS, card, state, setup };
