const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Product availability at centers
const inventory = {
  C1: ["A", "B", "C"],
  C2: ["B", "C", "D", "E", "F"],
  C3: ["C", "D", "E", "F", "G", "H", "I"]
};

// Distances (in km)
const distances = {
  C1: { L1: 10, C2: 15, C3: 25 },
  C2: { L1: 20, C1: 15, C3: 12 },
  C3: { L1: 30, C1: 25, C2: 12 }
};

const KM_COST = 2;
const STOP_COST = 2;

// Main logic to calculate minimal cost
function calculateMinCost(order) {
  const centers = ["C1", "C2", "C3"];
  const memo = new Map();

  function serialize(obj) {
    return JSON.stringify(obj, Object.keys(obj).sort());
  }

  function dfs(current, pending, visited) {
    const key = `${current}-${serialize(pending)}-${Array.from(visited).sort().join(",")}`;
    if (memo.has(key)) return memo.get(key);

    let cost = 0;
    let newPending = { ...pending };
    let fulfilledHere = false;

    for (let product of inventory[current]) {
      if (newPending[product]) {
        fulfilledHere = true;
        delete newPending[product];
      }
    }

    if (fulfilledHere) {
      cost += 2 * distances[current]["L1"] + STOP_COST; // Fulfillment cost
    }

    if (Object.keys(newPending).length === 0) {
      memo.set(key, cost);
      return cost;
    }

    let minCost = Infinity;

    for (let next of centers) {
      if (next !== current) {
        const travelCost = 2 * distances[current][next]; // round-trip
        const totalCost = cost + dfs(next, newPending, new Set([...visited, next])) + travelCost;
        minCost = Math.min(minCost, totalCost);
      }
    }

    memo.set(key, minCost);
    return minCost;
  }

  let minTotalCost = Infinity;
  for (let start of centers) {
    minTotalCost = Math.min(minTotalCost, dfs(start, order, new Set([start])));
  }

  return minTotalCost;
}

// POST API endpoint
app.post("/calculate-cost", (req, res) => {
  const order = req.body;
  if (!order || typeof order !== "object") {
    return res.status(400).json({ error: "Invalid input format" });
  }

  const cost = calculateMinCost(order);
  res.json({ cost });
});

// Start server
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
