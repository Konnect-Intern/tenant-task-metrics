// Task Usage Analytics — multi-year mock data with selectors
// Yearly view → x-axis = years (5-year comparison)
// Monthly view → x-axis = months of the selected year

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const YEARS = [2022, 2023, 2024, 2025, 2026];

// Realistic year-over-year growth scaling
const YEAR_BASE = {
  2022: 0.38,
  2023: 0.55,
  2024: 0.72,
  2025: 0.88,
  2026: 1.0,
};

// Per-resource share evolves over time (MCP grows the fastest)
const RESOURCE_SHARE = {
  2022: { konnectors: 0.72, agents: 0.23, mcp: 0.05 },
  2023: { konnectors: 0.65, agents: 0.27, mcp: 0.08 },
  2024: { konnectors: 0.58, agents: 0.30, mcp: 0.12 },
  2025: { konnectors: 0.53, agents: 0.32, mcp: 0.15 },
  2026: { konnectors: 0.49, agents: 0.34, mcp: 0.17 },
};

function pseudoNoise(seed, span = 0.18) {
  // deterministic, repeatable "noise" so the mock looks organic
  const v = Math.sin(seed * 9.137) * 43758.5453;
  return 1 + (v - Math.floor(v) - 0.5) * span;
}

function genMonthlyForYear(year) {
  const baseMonthly = 1_250_000 * YEAR_BASE[year]; // tasks/month at scale
  const share = RESOURCE_SHARE[year];
  return MONTHS.map((m, i) => {
    const seasonal = 1 + Math.sin((i / 12) * Math.PI * 2 - Math.PI / 6) * 0.14;
    const noise = pseudoNoise(year + i, 0.16);
    const total = Math.round(baseMonthly * seasonal * noise);
    const billable = Math.round(total * (0.77 + ((i * 7) % 6) / 100));
    const failed = Math.round(total * (0.035 + ((i * 11) % 12) / 1000));
    const successful = total - failed;
    const konnectors = Math.round(total * share.konnectors);
    const agents = Math.round(total * share.agents);
    const mcp = total - konnectors - agents;
    return {
      label: m,
      fullLabel: `${m} ${year}`,
      year,
      total, billable, successful, failed,
      konnectors, agents, mcp,
    };
  });
}

// Pre-compute monthly data per year
export const BY_YEAR_MONTHS = YEARS.reduce((acc, y) => {
  acc[y] = genMonthlyForYear(y);
  return acc;
}, {});

function aggregateYear(monthlyArr) {
  return monthlyArr.reduce(
    (acc, m) => ({
      total: acc.total + m.total,
      billable: acc.billable + m.billable,
      successful: acc.successful + m.successful,
      failed: acc.failed + m.failed,
      konnectors: acc.konnectors + m.konnectors,
      agents: acc.agents + m.agents,
      mcp: acc.mcp + m.mcp,
    }),
    { total: 0, billable: 0, successful: 0, failed: 0, konnectors: 0, agents: 0, mcp: 0 }
  );
}

// Pre-compute yearly aggregates
export const YEAR_AGGREGATES = YEARS.map((y) => ({
  label: String(y),
  fullLabel: String(y),
  year: y,
  ...aggregateYear(BY_YEAR_MONTHS[y]),
}));

// -------- KPI / Insight helpers --------

function pickFromMetric(row, resource) {
  if (resource === "total" || !resource) {
    return {
      total: row.total,
      billable: row.billable,
      successful: row.successful,
      failed: row.failed,
    };
  }
  // resource-specific (approximated proportionally)
  const v = row[resource];
  return {
    total: v,
    billable: Math.round(v * 0.78),
    failed: Math.round(v * 0.045),
    successful: v - Math.round(v * 0.045),
  };
}

function sumSeries(series, resource) {
  return series.reduce(
    (acc, r) => {
      const m = pickFromMetric(r, resource);
      return {
        total: acc.total + m.total,
        billable: acc.billable + m.billable,
        successful: acc.successful + m.successful,
        failed: acc.failed + m.failed,
      };
    },
    { total: 0, billable: 0, successful: 0, failed: 0 }
  );
}

function pctChange(curr, prev) {
  if (!prev) return 0;
  return ((curr - prev) / prev) * 100;
}

// Build a chart series with `metric` decomposition for the chosen resource
export function buildSeries(rows, resource) {
  return rows.map((r) => {
    const m = pickFromMetric(r, resource);
    return {
      label: r.label,
      fullLabel: r.fullLabel,
      total: m.total,
      billable: m.billable,
      successful: m.successful,
      failed: m.failed,
      konnectors: r.konnectors,
      agents: r.agents,
      mcp: r.mcp,
    };
  });
}

// -------- Slice builders --------

export function getMonthlySlice(year, resource = "total") {
  const rows = BY_YEAR_MONTHS[year];
  const prevYearRows = BY_YEAR_MONTHS[year - 1];
  const curr = sumSeries(rows, resource);
  const prev = prevYearRows ? sumSeries(prevYearRows, resource) : null;

  // Insights
  const series = buildSeries(rows, resource);
  const peak = series.reduce((a, b) => (b.total > a.total ? b : a), series[0]);
  const trough = series.reduce((a, b) => (b.total < a.total ? b : a), series[0]);
  const firstHalf = series.slice(0, 6).reduce((s, r) => s + r.total, 0);
  const secondHalf = series.slice(6).reduce((s, r) => s + r.total, 0);
  const momentum = pctChange(secondHalf, firstHalf);

  // Resource growth (compare last 3 months avg vs first 3 months avg)
  const resourceGrowth = ["konnectors", "agents", "mcp"].map((k) => {
    const first = (rows[0][k] + rows[1][k] + rows[2][k]) / 3;
    const last = (rows[9][k] + rows[10][k] + rows[11][k]) / 3;
    return { key: k, change: pctChange(last, first) };
  });
  const fastest = resourceGrowth.reduce((a, b) => (b.change > a.change ? b : a));

  const successRate = (curr.successful / curr.total) * 100;
  const projection = curr.total; // already full year aggregate for selected year

  return {
    rangeLabel: `Jan – Dec ${year}`,
    comparedTo: prev ? `vs ${year - 1}` : "no prior data",
    kpi: {
      total: { value: curr.total, change: pctChange(curr.total, prev?.total) },
      billable: { value: curr.billable, change: pctChange(curr.billable, prev?.billable) },
      successful: { value: curr.successful, change: pctChange(curr.successful, prev?.successful) },
      failed: { value: curr.failed, change: pctChange(curr.failed, prev?.failed) },
    },
    series,
    insights: {
      peak: { label: peak.fullLabel, value: peak.total },
      trough: { label: trough.fullLabel, value: trough.total },
      momentum,
      fastest: { key: fastest.key, change: fastest.change },
      successRate,
      projection,
    },
    breakdown: [
      { key: "konnectors", name: "Konnectors", total: rows.reduce((s, r) => s + r.konnectors, 0) },
      { key: "agents", name: "Agents", total: rows.reduce((s, r) => s + r.agents, 0) },
      { key: "mcp", name: "MCP Global", total: rows.reduce((s, r) => s + r.mcp, 0) },
    ].map((b, i, arr) => {
      const billable = Math.round(b.total * 0.78);
      const failed = Math.round(b.total * (0.04 + i * 0.005));
      const successful = b.total - failed;
      // change vs previous year for the same resource
      const prevRes = prevYearRows ? prevYearRows.reduce((s, r) => s + r[b.key], 0) : null;
      const change = prevRes ? pctChange(b.total, prevRes) : 0;
      return { ...b, billable, successful, failed, change };
    }),
  };
}

export function getYearlySlice(resource = "total") {
  const rows = YEAR_AGGREGATES;
  const series = buildSeries(rows, resource);

  const last = series[series.length - 1];
  const prev = series[series.length - 2];

  const curr = pickFromMetric(rows[rows.length - 1], resource);
  const prevAgg = pickFromMetric(rows[rows.length - 2], resource);

  // Insights
  const peak = series.reduce((a, b) => (b.total > a.total ? b : a), series[0]);
  const firstYear = series[0];
  const cagr =
    series.length > 1
      ? (Math.pow(last.total / firstYear.total, 1 / (series.length - 1)) - 1) * 100
      : 0;

  const resourceGrowth = ["konnectors", "agents", "mcp"].map((k) => {
    const f = rows[0][k];
    const l = rows[rows.length - 1][k];
    return { key: k, change: pctChange(l, f) };
  });
  const fastest = resourceGrowth.reduce((a, b) => (b.change > a.change ? b : a));

  const successRate = (curr.successful / curr.total) * 100;
  // simple linear projection for next year
  const yoyGrowth = pctChange(last.total, prev.total) / 100;
  const projection = Math.round(last.total * (1 + yoyGrowth));

  return {
    rangeLabel: `${YEARS[0]} – ${YEARS[YEARS.length - 1]}`,
    comparedTo: `${YEARS.length}-year trend`,
    kpi: {
      total: { value: curr.total, change: pctChange(curr.total, prevAgg.total) },
      billable: { value: curr.billable, change: pctChange(curr.billable, prevAgg.billable) },
      successful: { value: curr.successful, change: pctChange(curr.successful, prevAgg.successful) },
      failed: { value: curr.failed, change: pctChange(curr.failed, prevAgg.failed) },
    },
    series,
    insights: {
      peak: { label: peak.fullLabel, value: peak.total },
      cagr,
      fastest: { key: fastest.key, change: fastest.change },
      successRate,
      projection,
    },
    breakdown: ["konnectors", "agents", "mcp"].map((k, i) => {
      const total = rows[rows.length - 1][k];
      const billable = Math.round(total * 0.78);
      const failed = Math.round(total * (0.04 + i * 0.005));
      const successful = total - failed;
      const prevTotal = rows[rows.length - 2][k];
      const change = pctChange(total, prevTotal);
      const name = { konnectors: "Konnectors", agents: "Agents", mcp: "MCP Global" }[k];
      return { key: k, name, total, billable, successful, failed, change };
    }),
  };
}

// -------- Resource meta --------
export const RESOURCE_META = {
  konnectors: {
    name: "Konnectors",
    chartVar: "--chart-1",
    iconBg: "bg-[hsl(88,65%,93%)]",
    iconColor: "text-[hsl(88,65%,32%)]",
  },
  agents: {
    name: "Agents",
    chartVar: "--chart-2",
    iconBg: "bg-[hsl(38,92%,93%)]",
    iconColor: "text-[hsl(38,92%,38%)]",
  },
  mcp: {
    name: "MCP Global",
    chartVar: "--chart-5",
    iconBg: "bg-[hsl(200,75%,93%)]",
    iconColor: "text-[hsl(200,75%,38%)]",
  },
  total: {
    name: "Total",
    chartVar: "--primary",
    iconBg: "bg-accent",
    iconColor: "text-primary-strong",
  },
};

// -------- Formatters --------
export function formatNumber(n) {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

export function formatFull(n) {
  if (n == null) return "—";
  return Math.round(n).toLocaleString();
}

export function formatPct(n, digits = 1) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(digits)}%`;
}
