import { useMemo, useState } from "react";
import {
  TrendingUp, TrendingDown, ArrowUpRight, Download, Info,
  Sparkles, Server, Plug, Activity, CircleDot, Filter,
  BarChart3, TableIcon, Trophy, Rocket, ShieldCheck, Target,
  Zap,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, CartesianGrid,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie,
  ComposedChart, Area,
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
  formatNumber, formatFull, formatPct,
} from "@/lib/usageMockData";

const RESOURCE_ICONS = {
  konnectors: Plug,
  agents: Sparkles,
  mcp: Server,
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

function KpiCard({ testId, label, value, change, accent, icon: Icon, inverse, hint }) {
  return (
    <Card
      data-testid={testId}
      className="relative overflow-hidden border-border/70 shadow-xs hover:shadow-md transition-shadow"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className={cn("size-9 rounded-lg grid place-items-center", accent)}>
            <Icon className="size-[18px]" strokeWidth={2} />
          </div>
          <DeltaPill value={change} inverse={inverse} />
        </div>
        <div className="mt-4 flex items-baseline gap-1.5">
          <span className="text-[28px] leading-none font-bold tracking-tight num-tabular">
            {formatNumber(value)}
          </span>
          <span className="text-xs font-medium text-muted-foreground">tasks</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          {hint && (
            <TooltipProvider delayDuration={150}>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="size-3.5 text-muted-foreground/70 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[220px] text-xs">
                  {hint}
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightCard({ testId, icon: Icon, label, value, sub, tone = "default" }) {
  const toneClass = {
    default: "bg-accent text-primary-strong",
    success: "bg-[hsl(142,71%,93%)] text-[hsl(142,71%,28%)]",
    warn: "bg-[hsl(38,92%,93%)] text-[hsl(38,92%,32%)]",
    danger: "bg-[hsl(0,75%,95%)] text-[hsl(0,75%,42%)]",
    info: "bg-[hsl(200,75%,93%)] text-[hsl(200,75%,32%)]",
  }[tone];
  return (
    <div
      data-testid={testId}
      className="flex gap-3 p-4 rounded-xl border border-border/60 bg-card hover:border-border transition-colors"
    >
      <div className={cn("size-9 rounded-lg grid place-items-center shrink-0", toneClass)}>
        <Icon className="size-[18px]" strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground">
          {label}
        </div>
        <div className="text-base font-bold tracking-tight truncate num-tabular mt-0.5">
          {value}
        </div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5 truncate">{sub}</div>}
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-popover shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold mb-1.5 text-popover-foreground">{label}</div>
      <div className="space-y-1">
        {payload.map((p) => (
          <div key={p.dataKey} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ background: p.color || p.stroke || p.fill }} />
            <span className="text-muted-foreground capitalize">{p.name}:</span>
            <span className="font-semibold num-tabular text-popover-foreground">
              {formatFull(p.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TaskUsageTab() {
  const [period, setPeriod] = useState("monthly"); // monthly | yearly
  const [selectedYear, setSelectedYear] = useState(2026);
  const [resource, setResource] = useState("total");
  const [chartView, setChartView] = useState("graph"); // graph | table

  const data = useMemo(
    () => (period === "monthly" ? getMonthlySlice(selectedYear, resource) : getYearlySlice(resource)),
    [period, selectedYear, resource]
  );

  const xAxisLabel = period === "monthly" ? "Month" : "Year";
  const periodWord = period === "monthly" ? "month" : "year";

  // Distribution donut data
  const distribution = data.breakdown.map((b) => ({ name: b.name, value: b.total, key: b.key }));
  const distColors = ["--chart-1", "--chart-2", "--chart-5"];

  const tableRows = [
    ...data.breakdown,
    {
      key: "total",
      name: "Total (All Resources)",
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
            Task Usage Analytics
            <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-accent-foreground">
              <span className="size-1.5 rounded-full bg-primary animate-soft-pulse" />
              Live
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {data.rangeLabel}
            <span className="mx-1.5 opacity-50">•</span>
            {data.comparedTo}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div
            data-testid="period-toggle"
            className="inline-flex items-center rounded-lg border border-border bg-card p-0.5"
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

          {period === "monthly" && (
            <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
              <SelectTrigger data-testid="year-select" className="h-9 w-[110px] font-medium">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[...YEARS].reverse().map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={resource} onValueChange={setResource}>
            <SelectTrigger data-testid="resource-filter" className="h-9 w-[180px] gap-2 font-medium">
              <Filter className="size-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="total">All Resources</SelectItem>
              <SelectItem value="konnectors">Konnectors</SelectItem>
              <SelectItem value="agents">Agents</SelectItem>
              <SelectItem value="mcp">MCP Servers</SelectItem>
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
        <KpiCard testId="kpi-total" label="Total Tasks" value={data.kpi.total.value} change={data.kpi.total.change} icon={Activity} accent="bg-accent text-primary-strong"
          hint="Sum of every task executed across konnectors, agents and MCP servers." />
        <KpiCard testId="kpi-billable" label="Billable Tasks" value={data.kpi.billable.value} change={data.kpi.billable.change} icon={CircleDot} accent="bg-[hsl(38,92%,93%)] text-[hsl(38,92%,32%)]"
          hint="Tasks that count toward the tenant's plan quota." />
        <KpiCard testId="kpi-successful" label="Successful" value={data.kpi.successful.value} change={data.kpi.successful.change} icon={TrendingUp} accent="bg-[hsl(142,71%,93%)] text-[hsl(142,71%,28%)]"
          hint="Tasks completed without errors." />
        <KpiCard testId="kpi-failed" label="Failed" value={data.kpi.failed.value} change={data.kpi.failed.change} icon={TrendingDown} accent="bg-[hsl(0,75%,95%)] text-[hsl(0,75%,45%)]" inverse
          hint="Tasks that ended with errors. A drop here is good." />
      </div>

      {/* Business Insights Row */}
      <div data-testid="insights-row" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <InsightCard
          testId="insight-peak"
          icon={Trophy}
          label={`Peak ${periodWord}`}
          value={data.insights.peak.label}
          sub={`${formatFull(data.insights.peak.value)} tasks executed`}
          tone="default"
        />
        <InsightCard
          testId="insight-growth"
          icon={Rocket}
          label="Fastest growing"
          value={RESOURCE_META[data.insights.fastest.key].name}
          sub={`${formatPct(data.insights.fastest.change)} ${period === "monthly" ? "MoM trajectory" : "vs 2022"}`}
          tone="warn"
        />
        <InsightCard
          testId="insight-sla"
          icon={ShieldCheck}
          label="Success rate"
          value={`${data.insights.successRate.toFixed(2)}%`}
          sub={data.insights.successRate >= 95 ? "Above 95% SLA target" : "Below SLA — investigate"}
          tone={data.insights.successRate >= 95 ? "success" : "danger"}
        />
        <InsightCard
          testId="insight-projection"
          icon={Target}
          label={period === "monthly" ? "Momentum H2 vs H1" : "Projected next year"}
          value={period === "monthly" ? formatPct(data.insights.momentum) : formatNumber(data.insights.projection)}
          sub={period === "monthly"
            ? "Second-half pace vs first half"
            : `Based on ${formatPct(data.kpi.total.change, 1)} YoY growth`}
          tone="info"
        />
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
            <div data-testid="main-chart" className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data.series} margin={{ top: 8, right: 8, left: -4, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gTotalArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tickLine={false} axisLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tickLine={false} axisLine={false}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => formatNumber(v)} width={64} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(var(--accent))" }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                  <Bar dataKey="billable" name="Billable" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={period === "monthly" ? 16 : 32} />
                  <Bar dataKey="failed" name="Failed" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} barSize={period === "monthly" ? 10 : 22} />
                  <Area type="monotone" dataKey="total" name="Total" stroke="hsl(var(--chart-1))" strokeWidth={2.5} fill="url(#gTotalArea)" />
                  <Line type="monotone" dataKey="successful" name="Successful" stroke="hsl(var(--chart-3))" strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: "hsl(var(--chart-3))" }} />
                </ComposedChart>
              </ResponsiveContainer>
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
                Share of total tasks by resource type · {period === "monthly" ? selectedYear : "current year"}
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
                <h3 className="text-base font-bold">Performance by Resource</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Success rate, volume & growth signal</p>
              </div>
              <Badge variant="secondary" className="bg-accent text-accent-foreground border-0 text-[10px]">
                <Zap className="size-3 mr-1" strokeWidth={2.5} />
                Auto-updated
              </Badge>
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
              <h3 className="text-base font-bold">Resource Summary</h3>
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
                <TableHead className="pl-5">Resource</TableHead>
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
