import { type ReactNode, createContext, useContext, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Link, Route, Switch, Router as WouterRouter, useLocation, useRoute } from 'wouter';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, Edges, OrbitControls, RoundedBox } from '@react-three/drei';
import {
  Activity, ArrowDownRight, ArrowRight, Beaker, Bell, BookOpen, Box, Check, ChevronRight,
  CircleDot, ClipboardCheck, Cloud, Database, Download, FlaskConical, Gauge, GitBranch,
  Grid2X2, Layers3, LineChart as LineChartIcon, Microscope, MoreHorizontal, Move3D, Package,
  PanelLeft, Play, Plus, RotateCcw, Ruler, Settings2, ShieldCheck, SlidersHorizontal,
  Sparkles, Target, Upload, Users, X, ZoomIn,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, Cell, Line, LineChart, PolarAngleAxis, PolarGrid,
  PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Scatter, ScatterChart,
  Tooltip as ChartTooltip, XAxis, YAxis,
} from 'recharts';

const queryClient = new QueryClient();

type Material = {
  id: string;
  name: string;
  short: string;
  source: string;
  batch: string;
  status: string;
  date: string;
  color: string;
  confidence: string;
  description: string;
};

const materials: Material[] = [
  { id: 'pomegranate', name: 'Pomegranate Peel', short: 'PP-042', source: 'Punica granatum', batch: 'LOT-PP-042', status: 'ANALYZED', date: '14 Feb 2025', color: 'linear-gradient(135deg,#e9ad7a,#aa5659 48%,#355f68)', confidence: '94.6%', description: 'Dried peel fraction from post-consumer juice processing; high tannin and lignocellulosic signature.' },
  { id: 'rice-husk', name: 'Rice Husk', short: 'RH-018', source: 'Oryza sativa', batch: 'LOT-RH-018', status: 'SCREENED', date: '08 Feb 2025', color: 'linear-gradient(135deg,#e5cf9d,#9da77d)', confidence: '88.2%', description: 'Milled husk fraction with an elevated amorphous silica contribution.' },
  { id: 'banana', name: 'Banana Pseudostem', short: 'BP-031', source: 'Musa acuminata', batch: 'LOT-BP-031', status: 'FEATURES READY', date: '29 Jan 2025', color: 'linear-gradient(135deg,#c6dfab,#6c9e7c)', confidence: '91.1%', description: 'Bast-rich agricultural residue with strong aligned fiber potential.' },
  { id: 'coffee', name: 'Coffee Parchment', short: 'CP-009', source: 'Coffea arabica', batch: 'LOT-CP-009', status: 'IMPORTED', date: '19 Jan 2025', color: 'linear-gradient(135deg,#c59574,#83595a)', confidence: '—', description: 'Dry-milled parchment from washed coffee processing, awaiting microscopy.' },
  { id: 'bagasse', name: 'Sugarcane Bagasse', short: 'SB-024', source: 'Saccharum officinarum', batch: 'LOT-SB-024', status: 'VALIDATION PENDING', date: '06 Jan 2025', color: 'linear-gradient(135deg,#cfdfb1,#8fae94)', confidence: '86.9%', description: 'Press-milled fibrous residue selected for low-density panel screening.' },
];

const stages = ['Observation', 'Segmentation', 'Feature extraction', 'Fingerprint', 'Model screening', 'Product concept', 'Engineering', 'Validation', 'Archive'];
const featureData = [
  { name: 'Porosity', observed: 68, reference: 62 }, { name: 'Cell size', observed: 46, reference: 50 },
  { name: 'Wall thickness', observed: 74, reference: 69 }, { name: 'Branching', observed: 39, reference: 42 },
  { name: 'Alignment', observed: 57, reference: 54 }, { name: 'Surface ratio', observed: 81, reference: 73 },
];
const poreSeries = [
  { x: '10', area: 18, perimeter: 20 }, { x: '20', area: 27, perimeter: 31 }, { x: '30', area: 39, perimeter: 41 },
  { x: '40', area: 52, perimeter: 48 }, { x: '50', area: 61, perimeter: 57 }, { x: '60', area: 70, perimeter: 65 },
  { x: '70', area: 74, perimeter: 71 }, { x: '80', area: 78, perimeter: 79 },
];
const radarData = [
  { feature: 'Porosity', pomegranate: 78, rice: 64, banana: 71 }, { feature: 'Stiffness', pomegranate: 62, rice: 81, banana: 56 },
  { feature: 'Fiber align.', pomegranate: 57, rice: 48, banana: 86 }, { feature: 'Surface area', pomegranate: 82, rice: 69, banana: 65 },
  { feature: 'Water uptake', pomegranate: 74, rice: 52, banana: 77 }, { feature: 'Thermal buffer', pomegranate: 63, rice: 74, banana: 59 },
];
const scatterData = [
  { x: 29, y: 62, name: 'Pomegranate Peel', fill: '#267f7e' }, { x: 55, y: 45, name: 'Rice Husk', fill: '#a77b39' },
  { x: 67, y: 76, name: 'Banana Pseudostem', fill: '#7c68a2' }, { x: 40, y: 34, name: 'Coffee Parchment', fill: '#be7561' },
  { x: 72, y: 57, name: 'Sugarcane Bagasse', fill: '#6e9c74' },
];
const cells = [
  [11, 18, 44], [27, 14, 30], [46, 22, 54], [68, 17, 32], [84, 25, 42], [17, 50, 29], [39, 47, 57],
  [61, 44, 35], [78, 49, 59], [92, 57, 27], [8, 77, 35], [27, 72, 48], [51, 70, 28], [72, 78, 46],
  [88, 83, 34], [42, 90, 39], [61, 91, 23],
];

type WorkspaceContextValue = {
  sample: Material;
  setSampleId: (id: string) => void;
  flowStage: number;
  flowActive: boolean;
  advanceFlow: () => void;
  presentation: boolean;
  setPresentation: (value: boolean) => void;
};
const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);
const useWorkspace = () => {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error('Workspace context is missing');
  return value;
};

function NavItem({ href, icon: Icon, children }: { href: string; icon: typeof Activity; children: ReactNode }) {
  const [matched] = useRoute(href);
  return <Link href={href} className={`rs-nav-link ${matched ? 'active' : ''}`} data-testid={`link-nav-${href.slice(1) || 'overview'}`}><Icon /><span>{children}</span></Link>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { sample, presentation, setPresentation } = useWorkspace();
  const title = location === '/' ? 'Overview' : location.split('/')[1]?.replace('-', ' ') || 'Overview';
  return (
    <div className={`rs-app ${presentation ? 'rs-presentation' : ''}`}>
      <div className="rs-shell">
        <aside className="rs-sidebar">
          <Link href="/" className="rs-brand" data-testid="link-brand">
            <div className="rs-brand-mark">R</div>
            <div><strong>RESYNTRA</strong><small>material intelligence</small></div>
          </Link>
          <div className="rs-nav-label">Workspace</div>
          <nav className="rs-nav">
            <NavItem href="/" icon={Grid2X2}>Overview</NavItem>
            <NavItem href="/materials" icon={Layers3}>Material library</NavItem>
            <NavItem href="/microscopy" icon={Microscope}>Microscopy</NavItem>
            <NavItem href="/analysis" icon={LineChartIcon}>Feature analysis</NavItem>
            <NavItem href="/fingerprint" icon={Target}>Material fingerprint</NavItem>
            <NavItem href="/discovery" icon={Sparkles}>Discovery engine</NavItem>
            <NavItem href="/product-studio" icon={Box}>Product studio</NavItem>
            <NavItem href="/engineering" icon={Gauge}>Engineering</NavItem>
            <NavItem href="/validation" icon={ClipboardCheck}>Validation</NavItem>
          </nav>
          <div className="rs-nav-label">System</div>
          <nav className="rs-nav">
            <NavItem href="/data-sources" icon={Database}>Data sources</NavItem>
            <NavItem href="/model-status" icon={GitBranch}>Model status</NavItem>
            <NavItem href="/settings" icon={Settings2}>Settings</NavItem>
          </nav>
          <div className="rs-sidebar-bottom">
            <div className="rs-sample-mini">
              <div className="rs-sample-mini-dot" style={{ background: sample.color }} />
              <div><span>{sample.name}</span><small>{sample.short} · selected</small></div>
            </div>
          </div>
        </aside>
        <main className="rs-main">
          <header className="rs-topbar">
            <div className="rs-breadcrumb">RESYNTRA <ChevronRight size={12} /> <b>{title}</b></div>
            <div className="rs-top-actions">
              <div className="rs-sample-pill"><span className="rs-status-dot" /> <span>{sample.name}</span> <span className="rs-mono">{sample.short}</span></div>
              <button className="rs-icon-button" aria-label="Toggle presentation mode" onClick={() => setPresentation(!presentation)} data-testid="button-presentation"><PanelLeft size={14} /></button>
              <button className="rs-icon-button" aria-label="Notifications" data-testid="button-notifications"><Bell size={14} /></button>
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}

function PageHead({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description?: string; actions?: ReactNode }) {
  return <div className="rs-page-head"><div><div className="rs-eyebrow">{eyebrow}</div><h1 className="rs-page-title">{title}</h1>{description && <p className="rs-page-subtitle">{description}</p>}</div>{actions && <div>{actions}</div>}</div>;
}

function StatusChip({ status }: { status: string }) {
  const tone = status.includes('PENDING') ? 'rs-chip-amber' : status.includes('ANALYZED') ? 'rs-chip-green' : status.includes('READY') ? 'rs-chip-teal' : status.includes('SCREENED') ? 'rs-chip-purple' : 'rs-chip-gray';
  return <span className={`rs-chip ${tone}`}>{status}</span>;
}

function Overview() {
  const { sample, flowStage, flowActive, advanceFlow } = useWorkspace();
  const [location, setLocation] = useLocation();
  const progress = flowActive ? Math.round(((flowStage + 1) / stages.length) * 100) : 0;
  return <div className="rs-content">
    <PageHead eyebrow="Research workspace / 14 Feb 2025" title="From residue to rationale." description="A connected research instrument for reading agricultural waste as structure, signal, and manufacturable potential." actions={<button className="rs-button rs-button-ghost" onClick={() => setLocation('/materials')} data-testid="button-browse-library"><Layers3 size={14} /> Browse material library</button>} />
    {flowActive && <div className="rs-flow-banner"><span><b>Analysis sequence {flowStage + 1} of 9.</b> {stages[flowStage]} is ready to review.</span><span className="rs-mono">{progress}% resolved</span></div>}
    <div className="rs-card rs-hero">
      <div className="rs-hero-copy">
        <div className="rs-eyebrow">Selected material / {sample.short}</div>
        <h1>Read the hidden order inside <em>{sample.name.toLowerCase()}</em>.</h1>
        <p>RESYNTRA links microscopy observations to a material fingerprint, candidate models, and a lightweight product concept — without losing the evidence trail.</p>
        <div><button className="rs-button rs-button-primary" onClick={advanceFlow} data-testid="button-start-analysis">{flowActive ? (flowStage === stages.length - 1 ? 'Archive analysis' : `Advance to ${stages[Math.min(flowStage + 1, stages.length - 1)]}`) : 'Start material analysis'} <ArrowRight size={14} /></button></div>
      </div>
      <div className="rs-hero-visual"><div className="rs-micro-orb one" /><div className="rs-micro-orb two" /><div className="rs-micro-orb three" /><div className="rs-visual-caption">SYNTHETIC MICROGRAPH · PP-042 · 10 μm</div></div>
    </div>
    <div className="rs-card rs-pipeline" style={{ marginTop: 16 }}>
      <div className="rs-section-title"><div><h2>Research sequence</h2><p>One traceable thread from observation to future validation.</p></div><span className="rs-chip rs-chip-teal">{flowActive ? `${flowStage + 1}/9 active` : 'ready to begin'}</span></div>
      <div className="rs-pipeline-row">{stages.map((stage, index) => <div className={`rs-stage ${flowActive && index < flowStage ? 'done' : ''} ${flowActive && index === flowStage ? 'current' : ''}`} key={stage}><div className="rs-stage-dot">{flowActive && index < flowStage ? <Check size={12} /> : index + 1}</div><span>{stage}</span></div>)}</div>
    </div>
    <div className="rs-grid rs-grid-4" style={{ marginTop: 16 }}>
      {[
        ['Observed features', '18', 'from synthetic micrograph', '#e0f3f0'],
        ['Fingerprint confidence', '94.6%', 'material identity signal', '#ede8f7'],
        ['Product candidates', '06', 'screened for feasibility', '#fff0d2'],
        ['Validation records', '03', 'awaiting physical tests', '#e1f0e6'],
      ].map(([label, value, note, tint]) => <div className="rs-card rs-stat" style={{ '--stat-tint': tint } as React.CSSProperties} key={label}><div className="rs-stat-label">{label}</div><div className="rs-stat-value">{value}</div><div className="rs-stat-note">{note}</div></div>)}
    </div>
    <div className="rs-grid rs-grid-2" style={{ marginTop: 16 }}>
      <div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Current sample record</h2><p>Provenance remains attached to every downstream result.</p></div><Link href="/materials" className="rs-button rs-button-ghost" data-testid="link-sample-record">Open record <ChevronRight size={13} /></Link></div><div className="rs-list"><div className="rs-list-row"><div className="rs-list-main"><div className="rs-swatch" style={{ background: sample.color }} /><div><div className="rs-list-name">{sample.name}</div><div className="rs-list-meta">{sample.source} · {sample.batch}</div></div></div><StatusChip status={sample.status} /></div><div className="rs-list-row"><span className="rs-small">Microscopy coverage</span><span className="rs-mono">2,048 × 2,048 px</span></div><div className="rs-list-row"><span className="rs-small">Acquisition note</span><span className="rs-mono">brightfield / 10×</span></div></div></div>
      <div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Latest model signal</h2><p>Interpreted from observed and extracted features.</p></div><Link href="/discovery" className="rs-button rs-button-soft" data-testid="link-model-signal">Inspect output <ArrowRight size={13} /></Link></div><div className="rs-callout"><strong>Promising structural fit.</strong> The feature profile suggests a low-density acoustic panel direction with a 0.82 screening score. The model is not a validation result.</div><div className="rs-grid rs-grid-2" style={{ marginTop: 18 }}><div><div className="rs-kpi-label">Screening score</div><div className="rs-kpi-value">0.82</div></div><div><div className="rs-kpi-label">Material family</div><div className="rs-kpi-value" style={{ fontSize: 14 }}>Porous composite</div></div></div></div>
    </div>
  </div>;
}

function MaterialsPage() {
  const { sample, setSampleId } = useWorkspace();
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const filtered = useMemo(() => materials.filter((item) => `${item.name} ${item.source}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <div className="rs-content"><PageHead eyebrow="Material library / seeded dataset" title="Material library" description="Five agricultural residues with provenance, microscopy state, and the downstream evidence they currently support." actions={<button className="rs-button rs-button-primary" onClick={() => setShowAdd(true)} data-testid="button-add-material"><Plus size={14} /> Add material</button>} />
    <div className="rs-grid rs-grid-4" style={{ marginBottom: 16 }}>{[['5', 'seeded records'], ['3', 'feature-ready'], ['2', 'model-screened'], ['1', 'validation pending']].map(([v, l]) => <div className="rs-card rs-stat" key={l}><div className="rs-stat-label">{l}</div><div className="rs-stat-value">{v}</div><div className="rs-stat-note">connected evidence</div></div>)}</div>
    <div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Residue register</h2><p>Choose a sample to carry into every connected page.</p></div><div style={{ display: 'flex', gap: 8 }}><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter materials" data-testid="input-filter-materials" style={{ border: '1px solid #d7e4e6', borderRadius: 8, padding: '8px 10px', fontSize: 11, width: 170 }} /><button className="rs-icon-button" data-testid="button-material-more"><MoreHorizontal size={15} /></button></div></div>
      <div style={{ overflowX: 'auto' }}><table className="rs-table"><thead><tr><th>Material</th><th>Botanical source</th><th>Batch</th><th>Status</th><th>Confidence</th><th>Added</th><th /></tr></thead><tbody>{filtered.map((item) => <tr key={item.id}><td><div className="rs-list-main"><div className="rs-swatch" style={{ background: item.color }} /><div><div className="rs-list-name">{item.name}</div><div className="rs-list-meta">{item.id === sample.id ? 'Currently selected' : item.description.slice(0, 54) + '…'}</div></div></div></td><td className="rs-mono">{item.source}</td><td className="rs-mono">{item.batch}</td><td><StatusChip status={item.status} /></td><td className="rs-mono">{item.confidence}</td><td className="rs-mono">{item.date}</td><td><button className={`rs-button ${item.id === sample.id ? 'rs-button-soft' : 'rs-button-ghost'}`} onClick={() => { setSampleId(item.id); setLocation('/microscopy'); }} data-testid={`button-select-material-${item.id}`}>{item.id === sample.id ? 'Selected' : 'Select'} <ArrowRight size={12} /></button></td></tr>)}</tbody></table></div>
    </div>
    {showAdd && <div className="rs-modal-backdrop" onClick={() => setShowAdd(false)}><div className="rs-modal" onClick={(event) => event.stopPropagation()}><div className="rs-section-title"><div><h2>Register a material</h2><p>Frontend demonstration record.</p></div><button className="rs-icon-button" onClick={() => setShowAdd(false)} data-testid="button-close-add-material"><X size={14} /></button></div><div className="rs-form-row"><label>Material name</label><input placeholder="e.g. Cocoa pod husk" data-testid="input-new-material-name" /></div><div className="rs-form-row"><label>Botanical source</label><input placeholder="Latin binomial" data-testid="input-new-material-source" /></div><div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}><button className="rs-button rs-button-ghost" onClick={() => setShowAdd(false)}>Cancel</button><button className="rs-button rs-button-primary" onClick={() => setShowAdd(false)} data-testid="button-save-material"><Check size={13} /> Add to register</button></div></div></div>}
  </div>;
}

function Micrograph({ mode }: { mode: 'original' | 'segmentation' | 'overlay' }) {
  return <div className="rs-micro-canvas">{cells.map(([left, top, size], index) => <div className={`rs-cell ${mode === 'segmentation' ? 'seg' : mode === 'overlay' ? 'overlay' : ''}`} key={`${left}-${top}`} style={{ left: `${left}%`, top: `${top}%`, width: size, height: size, transform: `rotate(${index * 13}deg)` }} />)}<div className="rs-axis"><span>0 μm</span><span>25 μm</span><span>50 μm</span><span>75 μm</span><span>100 μm</span></div></div>;
}

function MicroscopyPage() {
  const { sample, advanceFlow } = useWorkspace();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<'original' | 'segmentation' | 'overlay'>('original');
  const [ran, setRan] = useState(false);
  return <div className="rs-content"><PageHead eyebrow={`Microscopy / ${sample.short}`} title="Microscopy workspace" description={`Synthetic brightfield view for ${sample.name}. Switch between the observation and the machine-readable feature layers.`} actions={<button className="rs-button rs-button-primary" onClick={() => { setRan(true); advanceFlow(); }} data-testid="button-run-analysis"><Play size={13} /> Run analysis</button>} />
    <div className="rs-grid rs-grid-2"><div className="rs-card rs-micro-card"><div className="rs-micro-toolbar"><span>OBSERVED · brightfield · 10×</span><span>2048 × 2048 px</span></div><div style={{ padding: 11 }}><div className="rs-tabs" style={{ borderColor: 'rgba(190,230,220,.14)', marginBottom: 11 }}>{(['original', 'segmentation', 'overlay'] as const).map((item) => <button key={item} className={`rs-tab ${mode === item ? 'active' : ''}`} style={{ color: mode === item ? '#bcecdf' : '#8baead', borderColor: mode === item ? '#75cabb' : 'transparent' }} onClick={() => setMode(item)} data-testid={`button-micrograph-${item}`}>{item === 'original' ? 'Original' : item === 'segmentation' ? 'Segmentation' : 'Feature overlay'}</button>)}</div><Micrograph mode={mode} /></div><div className="rs-micro-toolbar"><div className="rs-micro-legend"><span><i className="rs-legend-dot" style={{ background: '#e8aa7c' }} /> pores</span><span><i className="rs-legend-dot" style={{ background: '#75d6be' }} /> boundaries</span></div><span>{mode === 'original' ? 'RAW SIGNAL' : mode === 'segmentation' ? 'MODEL MASK' : 'FEATURE MAP'}</span></div></div>
      <div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Acquisition record</h2><p>Observation metadata stays attached to the image.</p></div><StatusChip status="OBSERVED" /></div><div className="rs-list"><div className="rs-list-row"><span className="rs-small">Sample</span><span className="rs-mono">{sample.name}</span></div><div className="rs-list-row"><span className="rs-small">Instrument</span><span className="rs-mono">Nikon Eclipse / BF-10</span></div><div className="rs-list-row"><span className="rs-small">Calibration</span><span className="rs-mono">stage micrometer / 2025.02</span></div><div className="rs-list-row"><span className="rs-small">Field of view</span><span className="rs-mono">100 × 100 μm</span></div><div className="rs-list-row"><span className="rs-small">Image checksum</span><span className="rs-mono">8a3e…c19b</span></div></div><div className="rs-callout" style={{ marginTop: 19 }}><strong>{ran ? 'Analysis queued in workspace.' : 'Ready for analysis.'}</strong> Segmentation will infer pore boundaries, wall thickness, and local orientation from this synthetic observation.</div><div style={{ display: 'flex', gap: 8, marginTop: 18 }}><button className="rs-button rs-button-soft" onClick={() => setLocation('/analysis')} data-testid="button-open-features"><LineChartIcon size={13} /> Open extracted features</button><button className="rs-button rs-button-ghost" data-testid="button-download-micrograph"><Download size={13} /> Export view</button></div></div></div>
  </div>;
}

function AnalysisPage() {
  const { sample } = useWorkspace();
  return <div className="rs-content"><PageHead eyebrow={`Feature analysis / ${sample.short}`} title="Observed → extracted" description="A readable handoff between what the microscope sees and what the model is allowed to use." actions={<div style={{ display: 'flex', gap: 8 }}><StatusChip status="OBSERVED" /><StatusChip status="EXTRACTED" /></div>} />
    <div className="rs-grid rs-grid-4" style={{ marginBottom: 16 }}>{[['18', 'features extracted', 'from 1 micrograph'], ['0.93', 'segmentation IoU', 'synthetic reference'], ['42.8%', 'mean porosity', 'area fraction'], ['7.4 μm', 'median pore size', 'interquartile 3.1 μm']].map(([v, l, n]) => <div className="rs-card rs-stat" key={l}><div className="rs-stat-label">{l}</div><div className="rs-stat-value">{v}</div><div className="rs-stat-note">{n}</div></div>)}</div>
    <div className="rs-grid rs-grid-2"><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Feature profile</h2><p>Normalized against the seeded material reference set.</p></div><span className="rs-chip rs-chip-teal">EXTRACTED</span></div><div className="rs-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={featureData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}><CartesianGrid stroke="#e9eff0" vertical={false} /><XAxis dataKey="name" tick={{ fontSize: 9, fill: '#789096' }} tickLine={false} axisLine={false} /><YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: '#789096' }} tickLine={false} axisLine={false} /><ChartTooltip contentStyle={{ border: '1px solid #dce9e8', borderRadius: 8, fontSize: 11 }} /><Line type="monotone" dataKey="observed" stroke="#267f7e" strokeWidth={2.5} dot={{ r: 3, fill: '#267f7e' }} /><Line type="monotone" dataKey="reference" stroke="#a9b9bc" strokeDasharray="4 4" strokeWidth={1.5} dot={false} /></LineChart></ResponsiveContainer></div><div className="rs-small">Solid trace: extracted observation. Dashed trace: reference centroid. Values are normalized feature intensities.</div></div>
      <div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Pore-scale distribution</h2><p>Area and perimeter accumulations across the field.</p></div><span className="rs-chip rs-chip-purple">MODEL INPUT</span></div><div className="rs-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={poreSeries} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}><defs><linearGradient id="areaTeal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#4da69d" stopOpacity={.32} /><stop offset="100%" stopColor="#4da69d" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#e9eff0" vertical={false} /><XAxis dataKey="x" tick={{ fontSize: 9, fill: '#789096' }} tickLine={false} axisLine={false} /><YAxis tick={{ fontSize: 9, fill: '#789096' }} tickLine={false} axisLine={false} /><ChartTooltip contentStyle={{ border: '1px solid #dce9e8', borderRadius: 8, fontSize: 11 }} /><Area type="monotone" dataKey="area" stroke="#4da69d" fill="url(#areaTeal)" strokeWidth={2} /><Line type="monotone" dataKey="perimeter" stroke="#8976af" strokeWidth={2} /></AreaChart></ResponsiveContainer></div><div className="rs-small">Cumulative profile from 17 detected cells. No physical measurement is implied by this synthetic view.</div></div></div>
    <div className="rs-card rs-card-pad" style={{ marginTop: 16 }}><div className="rs-section-title"><div><h2>Extracted feature register</h2><p>Traceable values passed into the material fingerprint.</p></div><button className="rs-button rs-button-ghost" data-testid="button-export-features"><Download size={13} /> Export CSV</button></div><div style={{ overflowX: 'auto' }}><table className="rs-table"><thead><tr><th>Feature</th><th>Value</th><th>Unit</th><th>Confidence</th><th>Classification</th></tr></thead><tbody>{[['Mean pore area', '38.4', 'μm²', '0.97', 'EXTRACTED'], ['Wall thickness', '4.8', 'μm', '0.91', 'EXTRACTED'], ['Local alignment', '0.57', 'index', '0.86', 'EXTRACTED'], ['Boundary roughness', '0.23', 'index', '0.88', 'EXTRACTED'], ['Tannin-associated tone', '0.71', 'spectral proxy', '0.78', 'OBSERVED']].map(([a,b,c,d,e]) => <tr key={a}><td className="rs-list-name">{a}</td><td className="rs-mono">{b}</td><td className="rs-mono">{c}</td><td className="rs-mono">{d}</td><td><StatusChip status={e} /></td></tr>)}</tbody></table></div></div>
  </div>;
}

function FingerprintPage() {
  const { sample } = useWorkspace();
  const [view, setView] = useState<'radar' | 'vector' | 'pca'>('radar');
  return <div className="rs-content"><PageHead eyebrow={`Material fingerprint / ${sample.short}`} title="A structural fingerprint" description="Compare the selected residue against nearby material families before the discovery model makes a recommendation." actions={<StatusChip status="MODEL OUTPUT" />} />
    <div className="rs-tabs">{(['radar', 'vector', 'pca'] as const).map((item) => <button className={`rs-tab ${view === item ? 'active' : ''}`} onClick={() => setView(item)} key={item} data-testid={`button-fingerprint-${item}`}>{item === 'radar' ? 'Radar comparison' : item === 'vector' ? 'Vector profile' : 'PCA field'}</button>)}</div>
    {view === 'radar' && <div className="rs-grid rs-grid-2"><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Signature comparison</h2><p>Six dimensions retained from the extracted feature set.</p></div></div><div className="rs-chart" style={{ height: 330 }}><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData} cx="50%" cy="50%" outerRadius="69%"><PolarGrid stroke="#dce9e8" /><PolarAngleAxis dataKey="feature" tick={{ fontSize: 9, fill: '#647e84' }} /><PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 8, fill: '#95a5a8' }} /><Radar name="Pomegranate peel" dataKey="pomegranate" stroke="#267f7e" fill="#267f7e" fillOpacity={.25} /><Radar name="Rice husk" dataKey="rice" stroke="#b0833e" fill="#b0833e" fillOpacity={.08} /><Radar name="Banana pseudostem" dataKey="banana" stroke="#8069a3" fill="#8069a3" fillOpacity={.08} /><ChartTooltip contentStyle={{ border: '1px solid #dce9e8', borderRadius: 8, fontSize: 11 }} /></RadarChart></ResponsiveContainer></div></div><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Fingerprint readout</h2><p>Current material position in the reference family.</p></div></div><div className="rs-fingerprint-ring"><span className="rs-fingerprint-label">open</span><span className="rs-fingerprint-label bottom">dense</span><span className="rs-fingerprint-label left">isotropic</span><span className="rs-fingerprint-label right">aligned</span><div className="rs-fingerprint-shape" /></div><div className="rs-list"><div className="rs-list-row"><span className="rs-small">Material family</span><b className="rs-list-name">Porous lignocellulosic</b></div><div className="rs-list-row"><span className="rs-small">Nearest neighbor</span><span className="rs-mono">Coffee parchment · 0.74</span></div><div className="rs-list-row"><span className="rs-small">Distinctive signal</span><span className="rs-mono">surface area +13%</span></div></div></div></div>}
    {view === 'vector' && <div className="rs-grid rs-grid-2"><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Vector profile</h2><p>Machine-readable representation, reduced to the most useful factors.</p></div></div><div style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>{[['Porosity vector', .78, '#267f7e'], ['Surface complexity', .82, '#8069a3'], ['Anisotropy', .57, '#b0833e'], ['Moisture affinity', .74, '#4b9e9b'], ['Compression potential', .61, '#c46f59']].map(([label, value, color]) => <div className="rs-meter" key={label as string}><span className="rs-small" style={{ width: 120 }}>{label as string}</span><div className="rs-meter-track"><i style={{ width: `${Number(value) * 100}%`, background: color as string }} /></div><span className="rs-meter-value">{Number(value).toFixed(2)}</span></div>)}</div></div><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Embedding notes</h2><p>Why this profile is useful for discovery.</p></div></div><div className="rs-callout"><strong>High surface-to-mass ratio.</strong> The selected material carries a distinct combination of open pore structure and moderate alignment. This makes it a plausible acoustic and absorption substrate, but not a direct structural replacement.</div></div></div>}
    {view === 'pca' && <div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Reference field / PCA projection</h2><p>Two principal components explain 71.4% of variance in the seeded comparison set.</p></div><span className="rs-chip rs-chip-teal">5 MATERIALS</span></div><div className="rs-chart" style={{ height: 410 }}><ResponsiveContainer width="100%" height="100%"><ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 5 }}><CartesianGrid stroke="#e9eff0" /><XAxis type="number" dataKey="x" name="PC1" tick={{ fontSize: 9, fill: '#789096' }} label={{ value: 'PC1 · 42.1%', position: 'insideBottom', offset: -9, fontSize: 10, fill: '#789096' }} /><YAxis type="number" dataKey="y" name="PC2" tick={{ fontSize: 9, fill: '#789096' }} label={{ value: 'PC2 · 29.3%', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#789096' }} /><ChartTooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => active && payload?.length ? <div style={{ background: '#fff', border: '1px solid #dce9e8', borderRadius: 8, padding: 9, fontSize: 10 }}>{payload[0].payload.name}</div> : null} /><Scatter data={scatterData} dataKey="y">{scatterData.map((item) => <Cell key={item.name} fill={item.fill} r={item.name === 'Pomegranate Peel' ? 8 : 6} />)}</Scatter></ScatterChart></ResponsiveContainer></div></div>}
  </div>;
}

function DiscoveryPage() {
  const { sample } = useWorkspace();
  const [, setLocation] = useLocation();
  return <div className="rs-content"><PageHead eyebrow={`Discovery engine / ${sample.short}`} title="Turn signal into a direction" description="The model proposes use cases, then shows the structural evidence that makes each proposal worth testing." actions={<StatusChip status="MODEL OUTPUT" />} />
    <div className="rs-grid rs-grid-2"><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Model recommendation</h2><p>Screening run · RESYNTRA-MDS v0.8.2</p></div><span className="rs-chip rs-chip-purple">0.82 SCORE</span></div><div style={{ padding: '13px 0 19px' }}><div className="rs-eyebrow">Primary direction</div><div style={{ fontSize: 26, fontWeight: 760, color: '#224953', letterSpacing: '-.05em' }}>Lightweight acoustic panel</div><p className="rs-small" style={{ maxWidth: 480 }}>A porous interior structure with moderate wall continuity. Recommend a non-load-bearing interior product concept while physical compression and moisture tests remain pending.</p></div><div className="rs-callout"><strong>MODEL OUTPUT.</strong> This is a ranked hypothesis from image-derived features, not a claim of performance or market readiness.</div><button className="rs-button rs-button-primary" style={{ marginTop: 18 }} onClick={() => setLocation('/product-studio')} data-testid="button-open-product-studio"><Box size={14} /> Develop in product studio <ArrowRight size={13} /></button></div>
      <div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Contributing features</h2><p>Feature attributions for the primary direction.</p></div></div><div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>{[['Surface-to-mass ratio', '0.28', 'strong positive', '#267f7e'], ['Pore continuity', '0.21', 'positive', '#4b9e9b'], ['Wall thickness variance', '0.14', 'positive', '#8069a3'], ['Local alignment', '0.09', 'contextual', '#b0833e'], ['Moisture proxy', '-0.06', 'risk modifier', '#c46f59']].map(([name, value, note, color]) => <div key={name} style={{ display: 'grid', gridTemplateColumns: '1fr 52px', gap: 12, alignItems: 'center' }}><div><div className="rs-list-name">{name}</div><div className="rs-progress" style={{ marginTop: 6 }}><i style={{ width: `${Math.abs(Number(value)) * 300}%`, background: color }} /></div><div className="rs-list-meta">{note}</div></div><span className="rs-mono" style={{ color }}>{value}</span></div>)}</div></div></div>
    <div className="rs-card rs-card-pad" style={{ marginTop: 16 }}><div className="rs-section-title"><div><h2>Application screening</h2><p>Ranked by fit to observed structure and known manufacturing constraints.</p></div><button className="rs-button rs-button-ghost" data-testid="button-rerun-screening"><RotateCcw size={13} /> Re-run screening</button></div><div style={{ overflowX: 'auto' }}><table className="rs-table"><thead><tr><th>Application</th><th>Fit</th><th>Manufacturing note</th><th>Evidence state</th><th /></tr></thead><tbody>{[['Acoustic interior panel', '0.82', 'Press-formable with binder screening', 'MODEL OUTPUT'], ['Protective transit insert', '0.76', 'Geometry can be cut from sheet', 'MODEL OUTPUT'], ['Horticulture substrate', '0.69', 'Moisture cycling required', 'VALIDATION PENDING'], ['Load-bearing board', '0.31', 'Compression risk is unresolved', 'VALIDATION PENDING']].map(([name, fit, note, state]) => <tr key={name}><td className="rs-list-name">{name}</td><td className="rs-mono">{fit}</td><td className="rs-small">{note}</td><td><StatusChip status={state} /></td><td><button className="rs-button rs-button-ghost" onClick={() => setLocation('/product-studio')} data-testid={`button-screen-${name.toLowerCase().replaceAll(' ', '-')}`}>Explore <ArrowRight size={12} /></button></td></tr>)}</tbody></table></div></div>
  </div>;
}

function ProductStudioPage() {
  const [zoom, setZoom] = useState(1);
  const [panMode, setPanMode] = useState(false);
  const [explode, setExplode] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [stress, setStress] = useState(false);
  const [thickness, setThickness] = useState(4.8);
  const [density, setDensity] = useState(42);
  const [webglAvailable] = useState(() => hasWebGL());
  const { sample } = useWorkspace();
  return <div className="rs-content"><PageHead eyebrow={`Product studio / ${sample.short}`} title="Make the hypothesis tangible" description="A lightweight, manufacturable panel concept driven by the selected pore and wall profile." actions={<div style={{ display: 'flex', gap: 8 }}><StatusChip status="MODEL OUTPUT" /><button className="rs-button rs-button-primary" data-testid="button-save-concept"><Check size={13} /> Save concept</button></div>} />
    <div className="rs-product-layout"><div className="rs-card rs-product-stage" data-testid="canvas-product-stage">{webglAvailable ? <Canvas camera={{ position: [0, 2.8, 5.8], fov: 38 }} dpr={[1, 1.5]} gl={{ antialias: true, alpha: true }} shadows><color attach="background" args={['#dcebea']} /><ambientLight intensity={1.7} /><directionalLight position={[4, 6, 5]} intensity={3.2} castShadow /><directionalLight position={[-4, 2, -2]} intensity={1.1} color="#8ac7c0" /><ProductPanelMesh thickness={thickness} density={density} explode={explode} wireframe={wireframe} stress={stress} zoom={zoom} panMode={panMode} /></Canvas> : <ProductCssFallback thickness={thickness} explode={explode} wireframe={wireframe} stress={stress} zoom={zoom} panMode={panMode} />}<div style={{ position: 'absolute', left: 17, top: 15, font: '10px var(--app-font-mono)', color: '#477774' }}>{webglAvailable ? (panMode ? 'PAN MODE · drag to move' : 'ORBIT MODE · drag to rotate') : 'PREVIEW MODE · CSS engineering surface'}</div><div style={{ position: 'absolute', right: 17, top: 15, display: 'flex', gap: 6 }}><button className="rs-icon-button" onClick={() => setZoom((value) => Math.min(1.5, value + .1))} data-testid="button-product-zoom-in"><ZoomIn size={14} /></button><button className="rs-icon-button" onClick={() => setZoom(1)} data-testid="button-product-reset"><RotateCcw size={14} /></button></div><div style={{ position: 'absolute', bottom: 15, right: 17, font: '9px var(--app-font-mono)', color: '#477774' }}>wheel to zoom · {Math.round(zoom * 100)}%</div></div>
      <div className="rs-card rs-product-control"><div className="rs-section-title"><div><h2>Geometry controls</h2><p>Parametric concept surface</p></div><SlidersHorizontal size={15} color="#5e8885" /></div><div className="rs-control"><label>Panel thickness <b>{thickness.toFixed(1)} mm</b></label><input type="range" min="2" max="9" step=".1" value={thickness} onChange={(event) => setThickness(Number(event.target.value))} data-testid="input-panel-thickness" /></div><div className="rs-control"><label>Cell density <b>{density}%</b></label><input type="range" min="20" max="70" value={density} onChange={(event) => setDensity(Number(event.target.value))} data-testid="input-cell-density" /></div><div className="rs-control"><label>Target format <b>600 × 300 mm</b></label><input type="range" min="0" max="2" defaultValue="1" data-testid="input-panel-format" /></div><div style={{ borderTop: '1px solid #e8eff0', margin: '8px 0 16px' }} /><label className="rs-check"><input type="checkbox" checked={panMode} onChange={(event) => setPanMode(event.target.checked)} data-testid="input-pan-mode" /><Move3D size={14} /> Pan mode</label><label className="rs-check"><input type="checkbox" checked={explode} onChange={(event) => setExplode(event.target.checked)} data-testid="input-exploded-view" /> Exploded view</label><label className="rs-check"><input type="checkbox" checked={wireframe} onChange={(event) => setWireframe(event.target.checked)} data-testid="input-wireframe" /> Wireframe overlay</label><label className="rs-check"><input type="checkbox" checked={stress} onChange={(event) => setStress(event.target.checked)} data-testid="input-stress-view" /> Simulated stress view</label>{stress && <div className="rs-stress-scale"><span>low</span><i /><span>high</span></div>}<div className="rs-callout" style={{ marginTop: 20 }}><strong>Manufacturing note.</strong> At {thickness.toFixed(1)} mm, the current concept remains within the seeded press-forming envelope.</div><button className="rs-button rs-button-soft" style={{ width: '100%', marginTop: 14 }} data-testid="button-export-cad"><Download size={13} /> Export concept brief</button></div></div>
  </div>;
}

function hasWebGL() {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

function ProductCssFallback({ thickness, explode, wireframe, stress, zoom, panMode }: { thickness: number; explode: boolean; wireframe: boolean; stress: boolean; zoom: number; panMode: boolean }) {
  const [rotation, setRotation] = useState({ x: 58, z: -12 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);
  return <div className="rs-product-grid rs-css-fallback-grid"><div className={`rs-model-wrap ${explode ? 'rs-exploded' : ''}`} onPointerDown={(event) => setDrag({ x: event.clientX, y: event.clientY })} onPointerMove={(event) => { if (!drag) return; const dx = event.clientX - drag.x; const dy = event.clientY - drag.y; setDrag({ x: event.clientX, y: event.clientY }); setRotation((current) => ({ x: current.x, z: current.z + dx * .35 })); }} onPointerUp={() => setDrag(null)} onPointerLeave={() => setDrag(null)} style={{ transform: `translate(-50%, -50%) rotateZ(${rotation.z}deg) scale(${zoom})` }}><div className={`rs-panel rs-panel-fallback ${wireframe ? 'rs-panel-wire' : ''} ${stress ? 'rs-panel-stress' : ''}`} style={{ height: `${150 + thickness * 8}px` }}><span style={{ position: 'absolute', left: 16, top: 14, font: '9px var(--app-font-mono)', color: 'rgba(20,83,81,.76)' }}>RS-PANEL / 01</span></div></div><div className="rs-css-note">{panMode ? 'Pan mode available in the full WebGL scene' : 'Synthetic engineering surface'}</div></div>;
}

function ProductPanelMesh({ thickness, density, explode, wireframe, stress, zoom, panMode }: { thickness: number; density: number; explode: boolean; wireframe: boolean; stress: boolean; zoom: number; panMode: boolean }) {
  const ribCount = Math.max(3, Math.round(density / 9));
  const depth = Math.max(.12, thickness / 22);
  const panelColor = stress ? '#dfa15d' : '#6dbcae';
  const ribColor = stress ? '#c9635b' : '#3b8f88';
  return <><OrbitControls enablePan={panMode} screenSpacePanning={true} minDistance={3.8} maxDistance={8} minPolarAngle={0.55} maxPolarAngle={1.45} target={[0, 0, 0]} /><group scale={zoom}>
    <RoundedBox args={[4.6, 2.45, depth]} radius={.16} smoothness={5} castShadow receiveShadow><meshStandardMaterial color={panelColor} roughness={.48} metalness={.08} transparent opacity={wireframe ? .16 : .95} /></RoundedBox>
    <Edges scale={1.01} color={wireframe ? '#236e70' : '#2c7c78'} />
    <group position-z={explode ? .16 : .03}>{Array.from({ length: ribCount }).map((_, index) => <mesh key={`rib-${index}`} position={[-1.65 + index * (3.3 / Math.max(1, ribCount - 1)), 0, .11 + (explode ? index % 2 * .08 : 0)]} rotation-z={index % 2 === 0 ? .08 : -.08} castShadow><boxGeometry args={[.07, 2.08, .06]} /><meshStandardMaterial color={ribColor} transparent opacity={wireframe ? .35 : .72} /></mesh>)}</group>
    <group position-z={explode ? .26 : .13}>{[[-1.72, -.82], [1.72, -.82], [-1.72, .82], [1.72, .82]].map(([x, y], index) => <mesh key={`hole-${index}`} position={[x, y, .02]} rotation-x={Math.PI / 2}><torusGeometry args={[.18, .045, 12, 28]} /><meshStandardMaterial color={wireframe ? '#236e70' : '#d9eeea'} metalness={.2} roughness={.35} /></mesh>)}</group>
    <mesh position={[0, 0, .13]}><boxGeometry args={[3.8, .06, .05]} /><meshStandardMaterial color={stress ? '#f4d17c' : '#b9e0d7'} /></mesh>
  </group><gridHelper args={[10, 18, '#77a9a5', '#acd0cc']} position={[0, -1.55, 0]} /><ContactShadows position={[0, -1.5, 0]} opacity={.3} scale={7} blur={2.2} far={4} /></>;
}

function EngineeringPage() {
  const { sample } = useWorkspace();
  return <div className="rs-content"><PageHead eyebrow={`Engineering / ${sample.short}`} title="Test the concept before the shop floor" description="Simulation frames the next physical question; it does not replace a physical test." actions={<StatusChip status="SIMULATED" />} />
    <div className="rs-grid rs-grid-4" style={{ marginBottom: 16 }}>{[['0.61', 'compressive fit', 'within screen'], ['12.4 kPa', 'peak pressure', 'simulated'], ['4.8 mm', 'wall thickness', 'concept value'], ['2.7 kg/m²', 'estimated mass', 'at 600 × 300 mm']].map(([v, l, n]) => <div className="rs-card rs-stat" key={l}><div className="rs-stat-label">{l}</div><div className="rs-stat-value">{v}</div><div className="rs-stat-note">{n}</div></div>)}</div>
    <div className="rs-grid rs-grid-2"><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Engineering readout</h2><p>Simulated against the concept geometry.</p></div><StatusChip status="SIMULATED" /></div><div className="rs-list"><div className="rs-list-row"><span className="rs-small">Load case</span><span className="rs-mono">distributed compression / 2.5 kPa</span></div><div className="rs-list-row"><span className="rs-small">Boundary condition</span><span className="rs-mono">perimeter fixed</span></div><div className="rs-list-row"><span className="rs-small">Peak displacement</span><span className="rs-mono">1.82 mm</span></div><div className="rs-list-row"><span className="rs-small">Safety margin</span><span className="rs-mono" style={{ color: '#2d8a72' }}>1.34 · provisional</span></div></div><div className="rs-callout" style={{ marginTop: 17 }}><strong>Engineering interpretation.</strong> The panel distributes a low uniform load without local collapse in the seeded simulation. Moisture-conditioned stiffness is still an unknown.</div></div><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Stress field</h2><p>Relative von Mises proxy across the panel.</p></div></div><div style={{ height: 260, borderRadius: 10, position: 'relative', overflow: 'hidden', background: 'linear-gradient(110deg,#2f759e,#4bb190 43%,#f0bd52 72%,#ce604e)' }}><div style={{ position: 'absolute', inset: 25, border: '1px dashed rgba(255,255,255,.58)', transform: 'skewY(-5deg)' }} /><div style={{ position: 'absolute', left: '22%', top: '28%', width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,237,150,.28)', filter: 'blur(3px)' }} /><div style={{ position: 'absolute', right: '17%', bottom: '20%', width: 55, height: 55, borderRadius: '50%', background: 'rgba(210,54,56,.35)', filter: 'blur(4px)' }} /><span style={{ position: 'absolute', left: 14, bottom: 12, color: '#fff', font: '9px var(--app-font-mono)' }}>SIMULATED · LOAD CASE 02</span></div><div className="rs-stress-scale" style={{ marginTop: 13 }}><span>0.0</span><i /><span>1.0 normalized stress</span></div></div></div>
    <div className="rs-card rs-card-pad" style={{ marginTop: 16 }}><div className="rs-section-title"><div><h2>Next engineering questions</h2><p>Turn a promising simulation into a defensible experiment.</p></div><button className="rs-button rs-button-primary" data-testid="button-create-test-plan"><ClipboardCheck size={13} /> Create test plan</button></div><div className="rs-grid rs-grid-3">{[['Moisture conditioning', 'Compare 24 h and 7 d conditioned stiffness.', 'high'], ['Edge finishing', 'Check cut-edge stability after press forming.', 'medium'], ['Binder ratio', 'Sweep binder content from 8–14 wt%.', 'medium']].map(([title, note, priority]) => <div className="rs-card rs-card-pad" style={{ background: '#f8fbfb' }} key={title}><div className="rs-eyebrow">{priority} priority</div><div className="rs-list-name">{title}</div><p className="rs-small">{note}</p><button className="rs-button rs-button-ghost" data-testid={`button-question-${title.toLowerCase().replaceAll(' ', '-')}`}>Add to plan <Plus size={12} /></button></div>)}</div></div>
  </div>;
}

function ValidationPage() {
  const { sample } = useWorkspace();
  const [selected, setSelected] = useState('compression');
  const checks = [['compression', 'Compression response', 'queued', 'Required before structural claims'], ['moisture', 'Moisture cycling', 'planned', '48 h / 75% RH exposure'], ['acoustics', 'Acoustic absorption', 'planned', 'Two frequency bands'], ['surface', 'Surface durability', 'open', 'Abrasion protocol to define']];
  return <div className="rs-content"><PageHead eyebrow={`Validation / ${sample.short}`} title="Close the loop" description="Digital evidence becomes a physical question. Track what is known, what is pending, and what must be measured next." actions={<button className="rs-button rs-button-primary" data-testid="button-add-validation"><Plus size={14} /> Add validation run</button>} />
    <div className="rs-card rs-card-pad" style={{ marginBottom: 16 }}><div className="rs-section-title"><div><h2>Digital → physical workflow</h2><p>{sample.name} / lightweight acoustic panel concept</p></div><span className="rs-chip rs-chip-amber">VALIDATION PENDING</span></div><div className="rs-progress" style={{ height: 7, margin: '20px 0 10px' }}><i style={{ width: '25%' }} /></div><div style={{ display: 'flex', justifyContent: 'space-between', color: '#74898e', font: '10px var(--app-font-mono)' }}><span>Concept locked</span><span>Protocol drafted</span><span>Physical run</span><span>Validated</span></div></div>
    <div className="rs-grid rs-grid-2"><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Validation register</h2><p>Select a run to review its protocol.</p></div></div><div className="rs-list">{checks.map(([id, title, status, note]) => <button key={id} onClick={() => setSelected(id)} style={{ textAlign: 'left', border: 0, borderBottom: '1px solid #edf1f2', background: selected === id ? '#f0f8f6' : 'transparent', padding: '14px 10px', margin: '0 -10px', borderRadius: 8 }} data-testid={`button-validation-${id}`}><div className="rs-list-row" style={{ border: 0, padding: 0 }}><div className="rs-list-main"><div style={{ width: 27, height: 27, borderRadius: '50%', display: 'grid', placeItems: 'center', background: selected === id ? '#d6eee7' : '#eef2f2', color: selected === id ? '#267f7e' : '#829297' }}>{status === 'queued' ? <ClipboardCheck size={13} /> : <CircleDot size={13} />}</div><div><div className="rs-list-name">{title}</div><div className="rs-list-meta">{note}</div></div></div><StatusChip status={status === 'queued' ? 'VALIDATION PENDING' : 'PLANNED'} /></div></button>)}</div></div><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>{checks.find((item) => item[0] === selected)?.[1]}</h2><p>Protocol detail / seeded template</p></div><Ruler size={16} color="#4d9290" /></div><div className="rs-list"><div className="rs-list-row"><span className="rs-small">Specimen</span><span className="rs-mono">RS-PANEL-01 · 3 replicates</span></div><div className="rs-list-row"><span className="rs-small">Instrument</span><span className="rs-mono">unassigned</span></div><div className="rs-list-row"><span className="rs-small">Operator</span><span className="rs-mono">researcher / student</span></div><div className="rs-list-row"><span className="rs-small">Evidence state</span><StatusChip status="VALIDATION PENDING" /></div></div><button className="rs-button rs-button-soft" style={{ marginTop: 18 }} data-testid="button-upload-validation"><Upload size={13} /> Attach physical result</button></div></div>
    <div className="rs-card rs-card-pad" style={{ marginTop: 16, background: 'linear-gradient(125deg,#173743,#245763)' }}><div style={{ maxWidth: 640 }}><div className="rs-eyebrow" style={{ color: '#91d2c6' }}>RESYNTRA / evidence chain</div><h2 style={{ color: '#f1faf8', fontSize: 27, letterSpacing: '-.05em', margin: '9px 0' }}>A hypothesis is only the beginning.</h2><p style={{ color: '#b6d1d0', fontSize: 12, lineHeight: 1.7, margin: 0 }}>When a physical result is attached, the material fingerprint can be re-read against reality. That is how residue becomes a reliable material language.</p></div><div style={{ marginTop: 18, display: 'flex', gap: 8 }}><button className="rs-button rs-button-amber" data-testid="button-prepare-report"><BookOpen size={13} /> Prepare research brief</button><button className="rs-button" style={{ color: '#d7efeb', border: '1px solid rgba(211,240,236,.25)', background: 'transparent' }} data-testid="button-share-validation"><Users size={13} /> Share with lab</button></div></div>
  </div>;
}

function DataSourcesPage() {
  const [showAdd, setShowAdd] = useState(false);
  return <div className="rs-content"><PageHead eyebrow="System / provenance" title="Data sources" description="Every material insight has a source, a transformation, and a confidence boundary." actions={<button className="rs-button rs-button-primary" onClick={() => setShowAdd(true)} data-testid="button-connect-source"><Plus size={14} /> Connect source</button>} /><div className="rs-grid rs-grid-3">{[['Microscopy archive', '17 image records', 'SYNCED', '#e2f4f0', Microscope], ['Material reference set', '5 seeded records', 'CURATED', '#eee9f8', Database], ['Engineering templates', '4 protocols', 'LOCAL', '#fff2d4', Ruler]].map(([name, count, status, tint, Icon]) => <div className="rs-card rs-card-pad" key={name as string}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 18 }}><div style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', borderRadius: 9, background: tint as string, color: '#367c7b' }}><Icon size={16} /></div><StatusChip status={status as string} /></div><div className="rs-list-name">{name as string}</div><div className="rs-list-meta">{count as string}</div><button className="rs-button rs-button-ghost" style={{ marginTop: 17 }} data-testid={`button-source-${(name as string).toLowerCase().replaceAll(' ', '-')}`}>Inspect lineage <ArrowRight size={12} /></button></div>)}</div><div className="rs-card rs-card-pad" style={{ marginTop: 16 }}><div className="rs-section-title"><div><h2>Provenance log</h2><p>Transformations applied to the current sample.</p></div></div><table className="rs-table"><thead><tr><th>Timestamp</th><th>Event</th><th>Source</th><th>Actor</th><th>State</th></tr></thead><tbody>{[['14 Feb 2025 · 10:42', 'Microscopy imported', 'Microscopy archive', 'lab-local', 'OBSERVED'], ['14 Feb 2025 · 10:45', 'Pore mask generated', 'Segmentation model', 'RESYNTRA-MDS', 'EXTRACTED'], ['14 Feb 2025 · 10:46', 'Fingerprint assembled', 'Feature registry', 'RESYNTRA-MDS', 'MODEL OUTPUT'], ['14 Feb 2025 · 10:48', 'Concept geometry simulated', 'Engineering templates', 'lab-local', 'SIMULATED']].map(([a,b,c,d,e]) => <tr key={a}><td className="rs-mono">{a}</td><td className="rs-list-name">{b}</td><td className="rs-small">{c}</td><td className="rs-mono">{d}</td><td><StatusChip status={e} /></td></tr>)}</tbody></table></div>{showAdd && <div className="rs-modal-backdrop" onClick={() => setShowAdd(false)}><div className="rs-modal" onClick={(event) => event.stopPropagation()}><div className="rs-section-title"><h2>Connect a local source</h2><button className="rs-icon-button" onClick={() => setShowAdd(false)}><X size={14} /></button></div><div className="rs-form-row"><label>Source label</label><input placeholder="e.g. SEM archive" /></div><div className="rs-form-row"><label>Source type</label><select defaultValue="microscopy"><option value="microscopy">Microscopy archive</option><option value="dataset">Reference dataset</option><option value="protocol">Engineering protocol</option></select></div><button className="rs-button rs-button-primary" onClick={() => setShowAdd(false)} data-testid="button-save-source">Save source</button></div></div>}</div>;
}

function ModelStatusPage() {
  return <div className="rs-content"><PageHead eyebrow="System / registry" title="Model status" description="A small, legible registry of the models behind each evidence state." actions={<button className="rs-button rs-button-ghost" data-testid="button-refresh-models"><RotateCcw size={13} /> Refresh registry</button>} /><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Active registry</h2><p>Local demonstration models with frozen versions for presentation.</p></div><span className="rs-chip rs-chip-green">ALL SYSTEMS NOMINAL</span></div><table className="rs-table"><thead><tr><th>Model</th><th>Version</th><th>Role</th><th>Last run</th><th>Latency</th><th>Status</th></tr></thead><tbody>{[['Segmentation / pore boundary', 'SEG-1.4.0', 'OBSERVED → EXTRACTED', '14 Feb · 10:45', '840 ms', 'READY'], ['Feature extractor / morphology', 'MORPH-0.8.2', 'EXTRACTED → FINGERPRINT', '14 Feb · 10:46', '1.2 s', 'READY'], ['Discovery ranker / application fit', 'MDS-0.8.2', 'FINGERPRINT → MODEL OUTPUT', '14 Feb · 10:48', '420 ms', 'READY'], ['Stress proxy / panel simulation', 'SIM-0.3.1', 'MODEL OUTPUT → SIMULATED', '14 Feb · 10:49', '2.4 s', 'READY']].map(([a,b,c,d,e,f]) => <tr key={a}><td className="rs-list-name"><ShieldCheck size={13} color="#4b9e9b" style={{ verticalAlign: 'middle', marginRight: 7 }} />{a}</td><td className="rs-mono">{b}</td><td className="rs-small">{c}</td><td className="rs-mono">{d}</td><td className="rs-mono">{e}</td><td><StatusChip status={f} /></td></tr>)}</tbody></table></div><div className="rs-grid rs-grid-3" style={{ marginTop: 16 }}>{[['Reproducibility', 'Frozen inputs', 'same output for same seeded input'], ['Traceability', 'Source-linked', 'every result retains lineage'], ['Human review', 'Required', 'model output is never validation']].map(([a,b,c]) => <div className="rs-card rs-card-pad" key={a}><div className="rs-eyebrow">{a}</div><div className="rs-list-name">{b}</div><p className="rs-small">{c}</p></div>)}</div></div>;
}

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [units, setUnits] = useState('metric');
  const [density, setDensity] = useState('balanced');
  return <div className="rs-content"><PageHead eyebrow="System / workspace preferences" title="Settings" description="Tune the research workspace for the way your lab reads, reviews, and communicates evidence." actions={<button className="rs-button rs-button-primary" onClick={() => setSaved(true)} data-testid="button-save-settings"><Check size={13} /> {saved ? 'Saved' : 'Save settings'}</button>} /><div className="rs-grid rs-grid-2"><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Workspace preferences</h2><p>Presentation and measurement defaults.</p></div><Settings2 size={16} color="#4d9290" /></div><div className="rs-form-row"><label>Workspace name</label><input defaultValue="RESYNTRA / Materials Lab" data-testid="input-workspace-name" /></div><div className="rs-form-row"><label>Measurement system</label><select value={units} onChange={(event) => setUnits(event.target.value)} data-testid="select-measurement-units"><option value="metric">Metric (μm, mm, kPa)</option><option value="imperial">Imperial (in, psi)</option></select></div><div className="rs-form-row"><label>Feature display density</label><select value={density} onChange={(event) => setDensity(event.target.value)} data-testid="select-feature-density"><option value="compact">Compact</option><option value="balanced">Balanced</option><option value="detailed">Detailed</option></select></div></div><div className="rs-card rs-card-pad"><div className="rs-section-title"><div><h2>Evidence guardrails</h2><p>Keep scientific labels unambiguous.</p></div><ShieldCheck size={16} color="#4d9290" /></div>{[['Show evidence state on every result', true], ['Flag model output before export', true], ['Allow validation claims without physical run', false]].map(([label, checked]) => <label className="rs-check" style={{ padding: '12px 0', borderBottom: '1px solid #edf1f2' }} key={label as string}><input type="checkbox" defaultChecked={checked as boolean} data-testid={`input-setting-${(label as string).slice(0, 8).toLowerCase().replaceAll(' ', '-')}`} /> {label as string}</label>)}<div className="rs-callout" style={{ marginTop: 18 }}><strong>Research mode is active.</strong> RESYNTRA will keep OBSERVED, EXTRACTED, MODEL OUTPUT, SIMULATED, and VALIDATION PENDING distinct in the interface.</div></div></div></div>;
}

function Router() {
  return <RoutedErrorBoundary><Shell><Switch><Route path="/" component={Overview} /><Route path="/materials" component={MaterialsPage} /><Route path="/microscopy" component={MicroscopyPage} /><Route path="/analysis" component={AnalysisPage} /><Route path="/fingerprint" component={FingerprintPage} /><Route path="/discovery" component={DiscoveryPage} /><Route path="/product-studio" component={ProductStudioPage} /><Route path="/engineering" component={EngineeringPage} /><Route path="/validation" component={ValidationPage} /><Route path="/data-sources" component={DataSourcesPage} /><Route path="/model-status" component={ModelStatusPage} /><Route path="/settings" component={SettingsPage} /><Route component={NotFound} /></Switch></Shell></RoutedErrorBoundary>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  const [sampleId, setSampleId] = useState('pomegranate');
  const [flowStage, setFlowStage] = useState(0);
  const [flowActive, setFlowActive] = useState(false);
  const [presentation, setPresentation] = useState(false);
  const sample = materials.find((item) => item.id === sampleId) || materials[0];
  const advanceFlow = () => { setFlowActive(true); setFlowStage((stage) => Math.min(stage + 1, stages.length - 1)); };
  return <WorkspaceContext.Provider value={{ sample, setSampleId, flowStage, flowActive, advanceFlow, presentation, setPresentation }}><QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider></WorkspaceContext.Provider>;
}

export default App;