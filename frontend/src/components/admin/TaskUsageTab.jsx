import { useMemo, useState } from "react";
import {
  TrendingUp, TrendingDown, ArrowUpRight, Download, Info,
  PlugZap, Brain, Cpu, Activity, Filter,
  BarChart3, TableIcon, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie,
} from "recharts";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

import {
  getMonthlySlice, getYearlySlice, RESOURCE_META, YEARS,
  formatNumber, formatFull,
} from "@/lib/usageMockData";

const RESOURCE_ICONS = {
  konnectors: PlugZap,
  agents: Brain,
  mcp: Cpu,
  total: Activity,
};

function DeltaPill({ value, inverse = false, small = false }) {
  const positive = inverse ? value < 0 : value > 0;
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return (
    <span
      data-testid="delta-pill"
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold num-tabular",
        small ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        positive
          ? "bg-[hsl(142,71%,93%)] text-[hsl(142,71%,28%)]"
          : "bg-[hsl(0,75%,95%)] text-[hsl(0,75%,42%)]"
      )}
    >
      <Icon className={small ? "size-2.5" : "size-3"} strokeWidth={2.5} />
      {Math.abs(value).toFixed(1)}%
    </span>
  );
}

function KpiCard({ testId, label, value, change, inverse, hint, index = 0 }) {
  return (
    <Card
      data-testid={testId}
      style={{ animationDelay: `${index * 70}ms` }}
      className="animate-rise relative overflow-hidden border-border/70 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-[box-shadow,transform] duration-200"
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-foreground">{label}</span>
          {hint && (
            <TooltipProvider delayDuration={150}>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 shrink-0 text-muted-foreground/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-xs">
                  {hint}
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span className="text-[30px] leading-none font-bold tracking-tight num-tabular">
            {formatNumber(value)}
          </span>
          <span className="text-xs font-medium text-muted-foreground">tasks</span>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/70 pt-3">
          <span className="text-xs text-muted-foreground">vs previous period</span>
          <DeltaPill value={change} inverse={inverse} />
        </div>
      </CardContent>
    </Card>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border/80 bg-popover/90 backdrop-blur-md shadow-xl px-3.5 py-2.5 text-xs min-w-[160px]">
      <div className="font-semibold mb-2 text-popover-foreground">{label}</div>
      <div className="space-y-1.5">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="size-2 rounded-full shrink-0" style={{ background: p.color || p.stroke || p.fill }} />
            <span className="text-muted-foreground capitalize">{p.name}</span>
            <span className="ml-auto font-semibold num-tabular text-popover-foreground">
              {formatFull(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const CHART_SERIES = [
  { key: "total", name: "Total", color: "--chart-1" },
  { key: "billable", name: "Billable", color: "--chart-2" },
  { key: "successful", name: "Successful", color: "--chart-3" },
  { key: "failed", name: "Failed", color: "--chart-4" },
];

function InteractiveLegend({ hidden, hovered, onToggle, onHover }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-4" data-testid="chart-legend">
      {CHART_SERIES.map((s) => {
        const isHidden = hidden.includes(s.key);
        const dimmed = hovered && hovered !== s.key;
        return (
          <button
            key={s.key}
            data-testid={`legend-${s.key}`}
            onClick={() => onToggle(s.key)}
            onMouseEnter={() => onHover(s.key)}
            onMouseLeave={() => onHover(null)}
            className={cn(
              "inline-flex items-center gap-1.5 text-xs font-medium transition-opacity duration-200",
              (isHidden || dimmed) ? "opacity-40" : "opacity-100"
            )}
          >
            <span
              className={cn("size-2.5 rounded-full transition-transform", !isHidden && "scale-100")}
              style={{ background: isHidden ? "hsl(var(--muted-foreground))" : `hsl(var(${s.color}))` }}
            />
            <span className={cn(isHidden && "line-through text-muted-foreground")}>{s.name}</span>
          </button>
        );
      })}
    </div>
  );
}

export default function TaskUsageTab() {
  const [period, setPeriod] = useState("monthly"); // monthly | yearly
  const [selectedYear, setSelectedYear] = useState(2026);
  const [resource, setResource] = useState("total");
  const [chartView, setChartView] = useState("graph"); // graph | table
  const [hiddenSeries, setHiddenSeries] = useState([]);
  const [hoveredSeries, setHoveredSeries] = useState(null);

  const toggleSeries = (key) =>
    setHiddenSeries((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const data = useMemo(
    () => (period === "monthly" ? getMonthlySlice(selectedYear, resource) : getYearlySlice(resource)),
    [period, selectedYear, resource]
  );

  const xAxisLabel = period === "monthly" ? "Month" : "Year";

  // Distribution donut data
  const distribution = data.breakdown.map((b) => ({ name: b.name, value: b.total, key: b.key }));
  const distColors = ["--chart-1", "--chart-2", "--chart-5"];

  const tableRows = [
    ...data.breakdown,
    {
      key: "total",
      name: "Total (All Modules)",
      total: data.kpi.total.value,
      billable: data.kpi.billable.value,
      successful: data.kpi.successful.value,
      failed: data.kpi.failed.value,
      change: data.kpi.total.change,
      bold: true,
    },
  ];

  // Chart series total row for footer
  const seriesTotals = data.series.reduce(
    (acc, r) => ({
      total: acc.total + r.total,
      billable: acc.billable + r.billable,
      successful: acc.successful + r.successful,
      failed: acc.failed + r.failed,
    }),
    { total: 0, billable: 0, successful: 0, failed: 0 }
  );

  return (
    <div data-testid="task-usage-tab" className="space-y-6">
      {/* Header / Filters Row */}
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <h2 className="text-xl font-bold tracking-tight">Task Usage Analytics</h2>
          <div
            data-testid="period-toggle"
            className="inline-flex items-center self-start rounded-lg border border-border bg-card p-0.5 sm:self-auto"
          >
            {["monthly", "yearly"].map((p) => (
              <button
                key={p}
                data-testid={`period-${p}`}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3.5 py-1.5 text-sm font-semibold rounded-md transition-all capitalize",
                  period === p
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap xl:justify-end">
          {period === "monthly" && (
            <div
              data-testid="year-stepper"
              className="inline-flex w-[152px] shrink-0 items-center h-9 rounded-lg border border-border bg-card overflow-hidden"
            >
              <button
                data-testid="year-prev"
                onClick={() => setSelectedYear((y) => Math.max(YEARS[0], y - 1))}
                disabled={selectedYear <= YEARS[0]}
                className="h-full w-9 shrink-0 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:text-muted-foreground/40 disabled:hover:bg-transparent transition-colors"
                aria-label="Previous year"
              >
                <ChevronLeft className="size-4" />
              </button>
              <div className="h-full min-w-0 flex-1 flex items-center justify-center gap-1.5 border-x border-border">
                <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground">
                  Year
                </span>
                <span data-testid="year-value" className="text-sm font-bold num-tabular">
                  {selectedYear}
                </span>
              </div>
              <button
                data-testid="year-next"
                onClick={() => setSelectedYear((y) => Math.min(YEARS[YEARS.length - 1], y + 1))}
                disabled={selectedYear >= YEARS[YEARS.length - 1]}
                className="h-full w-9 shrink-0 grid place-items-center text-muted-foreground hover:text-foreground hover:bg-secondary disabled:text-muted-foreground/40 disabled:hover:bg-transparent transition-colors"
                aria-label="Next year"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}

          <Select value={resource} onValueChange={setResource}>
            <SelectTrigger data-testid="resource-filter" className="h-9 w-[180px] gap-2 font-medium">
              <Filter className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total">All Modules</SelectItem>
              <SelectItem value="konnectors">Konnectors</SelectItem>
              <SelectItem value="agents">Agents</SelectItem>
              <SelectItem value="mcp">MCP Global</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" data-testid="export-btn" className="h-9 gap-1.5">
            <Download className="size-4" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div data-testid="kpi-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard testId="kpi-total" index={0} label="Total Tasks" value={data.kpi.total.value} change={data.kpi.total.change}
          hint="Sum of every task executed across konnectors, agents and MCP Global." />
        <KpiCard testId="kpi-billable" index={1} label="Billable Tasks" value={data.kpi.billable.value} change={data.kpi.billable.change}
          hint="Tasks that count toward the tenant's plan quota." />
        <KpiCard testId="kpi-successful" index={2} label="Successful Tasks" value={data.kpi.successful.value} change={data.kpi.successful.change}
          hint="Tasks completed without errors." />
        <KpiCard testId="kpi-failed" index={3} label="Failed Tasks" value={data.kpi.failed.value} change={data.kpi.failed.change} inverse
          hint="Tasks that ended with errors. A drop here is good." />
      </div>

      {/* Main chart card with Graph/Table toggle */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5">
            <div>
              <h3 className="text-base font-bold">
                Task Execution — {period === "monthly" ? `Months of ${selectedYear}` : `${YEARS[0]}–${YEARS[YEARS.length - 1]}`}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {xAxisLabel} on x-axis ·{" "}
                <span className="font-semibold text-foreground">{RESOURCE_META[resource].name}</span>
                {" "}view
              </p>
            </div>

            <div
              data-testid="view-toggle"
              className="inline-flex items-center rounded-lg border border-border bg-card p-0.5"
            >
              <button
                data-testid="view-graph"
                onClick={() => setChartView("graph")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all inline-flex items-center gap-1.5",
                  chartView === "graph"
                    ? "bg-secondary text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <BarChart3 className="size-3.5" />
                Graph
              </button>
              <button
                data-testid="view-table"
                onClick={() => setChartView("table")}
                className={cn(
                  "px-3 py-1.5 text-xs font-semibold rounded-md transition-all inline-flex items-center gap-1.5",
                  chartView === "table"
                    ? "bg-secondary text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <TableIcon className="size-3.5" />
                Table
              </button>
            </div>
          </div>

          {chartView === "graph" ? (
            <div data-testid="main-chart" className="w-full">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.series} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} dy={6}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tickLine={false} axisLine={false}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => formatNumber(v)} width={64} />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1, strokeDasharray: "4 4" }} />
                    {CHART_SERIES.map((s) => {
                      const dimmed = hoveredSeries && hoveredSeries !== s.key;
                      return (
                        <Line
                          key={s.key}
                          type="monotone"
                          dataKey={s.key}
                          name={s.name}
                          hide={hiddenSeries.includes(s.key)}
                          stroke={`hsl(var(${s.color}))`}
                          strokeWidth={hoveredSeries === s.key ? 3 : 2}
                          strokeOpacity={dimmed ? 0.2 : 1}
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 2, stroke: "hsl(var(--card))" }}
                          animationDuration={700}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <InteractiveLegend
                hidden={hiddenSeries}
                hovered={hoveredSeries}
                onToggle={toggleSeries}
                onHover={setHoveredSeries}
              />
            </div>
          ) : (
            <div data-testid="main-table" className="rounded-lg border border-border/70 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="pl-4">{xAxisLabel}</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Billable</TableHead>
                    <TableHead className="text-right">Successful</TableHead>
                    <TableHead className="text-right">Failed</TableHead>
                    <TableHead className="text-right pr-4">Success Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.series.map((row) => {
                    const rate = ((row.successful / row.total) * 100).toFixed(2);
                    return (
                      <TableRow key={row.label} data-testid={`series-row-${row.label}`}>
                        <TableCell className="pl-4 font-medium">{row.fullLabel}</TableCell>
                        <TableCell className="text-right num-tabular">{formatFull(row.total)}</TableCell>
                        <TableCell className="text-right num-tabular text-muted-foreground">{formatFull(row.billable)}</TableCell>
                        <TableCell className="text-right num-tabular text-[hsl(142,71%,32%)]">{formatFull(row.successful)}</TableCell>
                        <TableCell className="text-right num-tabular text-[hsl(0,75%,45%)]">{formatFull(row.failed)}</TableCell>
                        <TableCell className="text-right pr-4 num-tabular">{rate}%</TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="bg-accent/40 hover:bg-accent/60 font-bold">
                    <TableCell className="pl-4">Total</TableCell>
                    <TableCell className="text-right num-tabular">{formatFull(seriesTotals.total)}</TableCell>
                    <TableCell className="text-right num-tabular">{formatFull(seriesTotals.billable)}</TableCell>
                    <TableCell className="text-right num-tabular text-[hsl(142,71%,32%)]">{formatFull(seriesTotals.successful)}</TableCell>
                    <TableCell className="text-right num-tabular text-[hsl(0,75%,45%)]">{formatFull(seriesTotals.failed)}</TableCell>
                    <TableCell className="text-right pr-4 num-tabular">
                      {((seriesTotals.successful / seriesTotals.total) * 100).toFixed(2)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Two-column: Distribution + Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="border-border/70 shadow-xs lg:col-span-2">
          <CardContent className="p-5">
            <div className="mb-4">
              <h3 className="text-base font-bold">Usage Distribution</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Share of total tasks by module type
              </p>
            </div>
            <div className="flex items-center gap-5">
              <div className="h-[180px] w-[180px] shrink-0 relative">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={distribution} dataKey="value" innerRadius={56} outerRadius={84} paddingAngle={2} stroke="none">
                      {distribution.map((entry, idx) => (
                        <Cell key={entry.key} fill={`hsl(var(${distColors[idx]}))`} />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 grid place-items-center pointer-events-none">
                  <div className="text-center">
                    <div className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">Total</div>
                    <div className="text-lg font-bold num-tabular">{formatNumber(data.kpi.total.value)}</div>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-3">
                {distribution.map((d, idx) => {
                  const pct = ((d.value / data.kpi.total.value) * 100).toFixed(1);
                  return (
                    <div key={d.key} data-testid={`dist-${d.key}`}>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 font-medium">
                          <span className="size-2.5 rounded-sm" style={{ background: `hsl(var(${distColors[idx]}))` }} />
                          {d.name}
                        </span>
                        <span className="num-tabular text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: `hsl(var(${distColors[idx]}))` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-xs lg:col-span-3">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold">Performance by Module</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Success rate, volume & growth signal</p>
              </div>
            </div>
            <div className="space-y-3">
              {data.breakdown.map((b) => {
                const Icon = RESOURCE_ICONS[b.key];
                const meta = RESOURCE_META[b.key];
                const successRate = ((b.successful / b.total) * 100).toFixed(2);
                return (
                  <div
                    key={b.key}
                    data-testid={`perf-${b.key}`}
                    className="flex items-center gap-4 p-3 rounded-lg border border-border/60 hover:border-border hover:bg-accent/40 transition-colors"
                  >
                    <div className={cn("size-10 rounded-lg grid place-items-center shrink-0", meta.iconBg)}>
                      <Icon className={cn("size-5", meta.iconColor)} strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">{b.name}</span>
                        <DeltaPill value={b.change} />
                      </div>
                      <div className="mt-1 flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground num-tabular">{formatFull(b.total)}</span> tasks
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          Success rate{" "}
                          <span className="font-semibold text-[hsl(142,71%,32%)] num-tabular">{successRate}%</span>
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden flex">
                        <div className="h-full bg-[hsl(142,71%,42%)]" style={{ width: `${successRate}%` }} />
                        <div className="h-full bg-[hsl(0,75%,58%)]" style={{ width: `${(100 - successRate).toFixed(2)}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed breakdown table */}
      <Card className="border-border/70 shadow-xs">
        <CardContent className="p-0">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <h3 className="text-base font-bold">Module Summary</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {period === "monthly" ? `Aggregated for ${selectedYear}` : `Current year (${YEARS[YEARS.length - 1]})`}
                {" "}· change is{" "}
                {period === "monthly" ? `vs ${selectedYear - 1}` : "vs previous year"}
              </p>
            </div>
            <Button variant="ghost" size="sm" data-testid="view-all-btn" className="h-8 gap-1 text-primary-strong hover:text-primary-strong">
              View raw logs
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
          <Separator />
          <Table data-testid="usage-table">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-5">Module</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Billable</TableHead>
                <TableHead className="text-right">Successful</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Success Rate</TableHead>
                <TableHead className="text-right pr-5">Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((row) => {
                const Icon = RESOURCE_ICONS[row.key];
                const meta = RESOURCE_META[row.key];
                const rate = ((row.successful / row.total) * 100).toFixed(2);
                return (
                  <TableRow
                    key={row.key}
                    data-testid={`row-${row.key}`}
                    className={cn(row.bold && "bg-accent/40 hover:bg-accent/60 font-semibold")}
                  >
                    <TableCell className="pl-5">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("size-7 rounded-md grid place-items-center", meta.iconBg)}>
                          <Icon className={cn("size-4", meta.iconColor)} strokeWidth={2} />
                        </div>
                        <span className={row.bold ? "font-bold" : "font-medium"}>{row.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right num-tabular">{formatFull(row.total)}</TableCell>
                    <TableCell className="text-right num-tabular text-muted-foreground">{formatFull(row.billable)}</TableCell>
                    <TableCell className="text-right num-tabular text-[hsl(142,71%,32%)]">{formatFull(row.successful)}</TableCell>
                    <TableCell className="text-right num-tabular text-[hsl(0,75%,45%)]">{formatFull(row.failed)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-[hsl(142,71%,93%)] text-[hsl(142,71%,28%)] hover:bg-[hsl(142,71%,90%)] num-tabular border-0">
                        {rate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-5">
                      <div className="inline-flex"><DeltaPill value={row.change} /></div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
