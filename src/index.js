const FUEL_PRICES_MOCK = {
  "RON95": 2.15,
  "RON97": 2.55,
  "Diesel": 2.05,
};

async function fetchPriceFromAPI(location, fuelType) {
  const key = COLLECTAPI_KEY;
  if (!key) {
    return null;
  }

  const url = `https://api.collectapi.com/gasPrice/getDetail?country=Malaysia&fuel=${encodeURIComponent(fuelType)}`;
  const response = await fetch(url, {
    headers: {
      "content-type": "application/json",
      "authorization": `apikey ${key}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (data && data.result && data.result[0] && data.result[0].price) {
    return Number(data.result[0].price);
  }
  return null;
}

function fallbackPrice(fuelType) {
  return FUEL_PRICES_MOCK[fuelType] || 2.2;
}

async function priceForFuel(location, fuelType) {
  const price = await fetchPriceFromAPI(location, fuelType);
  return price || fallbackPrice(fuelType);
}

function computeAnalysis(records) {
  if (!records || records.length === 0) return { totalLitres: 0, totalCost: 0, avgPerLitre: 0, count: 0 };

  const totalLitres = records.reduce((acc, r) => acc + Number(r.litre || 0), 0);
  const totalCost = records.reduce((acc, r) => acc + Number(r.cost || 0), 0);
  const avgPerLitre = totalLitres > 0 ? totalCost / totalLitres : 0;

  const byFuel = records.reduce((acc, r) => {
    const key = r.fuelType || "Unknown";
    if (!acc[key]) acc[key] = { litres: 0, cost: 0, count: 0 };
    acc[key].litres += Number(r.litre || 0);
    acc[key].cost += Number(r.cost || 0);
    acc[key].count += 1;
    return acc;
  }, {});

  return {
    totalLitres,
    totalCost,
    avgPerLitre: Number(avgPerLitre.toFixed(3)),
    count: records.length,
    byFuel,
  };
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);

  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (url.pathname === "/api/price" && request.method === "GET") {
    const location = url.searchParams.get("location") || "Malaysia";
    const fuelType = url.searchParams.get("fuelType") || "RON95";
    const price = await priceForFuel(location, fuelType);
    return new Response(JSON.stringify({ location, fuelType, unitPrice: price }), {
      headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  if (url.pathname === "/api/record" && request.method === "POST") {
    const body = await request.json();
    const location = body.location || "Malaysia";
    const fuelType = body.fuelType || "RON95";
    const litre = Number(body.litre || 0);
    const notes = body.notes || "";
    const history = Array.isArray(body.history) ? body.history : [];

    const unitPrice = await priceForFuel(location, fuelType);
    const cost = Number((unitPrice * litre).toFixed(2));

    const newRecord = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      location,
      fuelType,
      litre,
      unitPrice,
      cost,
      notes,
    };

    const combined = [...history, newRecord].slice(-100);
    const stats = computeAnalysis(combined);

    return new Response(JSON.stringify({ record: newRecord, stats, combined }), {
      headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  return new Response(JSON.stringify({ error: "Not found" }), {
    status: 404,
    headers: { "content-type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
}
