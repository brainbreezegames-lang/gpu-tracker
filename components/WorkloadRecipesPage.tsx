import React, { useState, useMemo } from 'react';
import {
  Image, BookOpen, Cpu, Video, Zap,
  HardDrive, MemoryStick, ExternalLink,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import { GPUInstance, Availability, Commitment } from '../types';
import { getContinuityScore, getContinuityLabel, calcTMC } from '../services/gpuUtils';

// ── Recipe definitions ────────────────────────────────────────────────────────

interface Recipe {
  id: string;
  icon: React.FC<{ className?: string }>;
  title: string;
  tagline: string;
  accentColor: string;
  accentBg: string;
  minVram: number;
  minGpus: number;
  preferredModels: RegExp[];
  storageGB: number;
  egressGB: number;
  hoursPerWeek: number;
  stack: string[];
  steps: string[];
  tips: string[];
}

const RECIPES: Recipe[] = [
  {
    id: 'sdxl',
    icon: Image,
    title: 'SDXL / ComfyUI Image Gen',
    tagline: 'Stable Diffusion XL & ControlNet — high-throughput inference',
    accentColor: 'text-slate-500',
    accentBg: 'bg-slate-50 dark:bg-slate-500/10',
    minVram: 12, minGpus: 1,
    preferredModels: [/RTX.*4090/i, /RTX.*3090/i, /A40/i, /L40/i, /A100/i],
    storageGB: 150, egressGB: 20, hoursPerWeek: 20,
    stack: ['ComfyUI', 'SDXL', 'ControlNet'],
    steps: [
      'Provision ≥12GB VRAM (RTX 4090 best for speed)',
      'Pull ComfyUI Docker or install with pip',
      'Download SDXL base + refiner (~7GB)',
      'Enable xFormers for memory efficiency',
      'Use batched inference for throughput',
    ],
    tips: [
      'RTX 4090 is ~40% faster than A100 for diffusion',
      'For >50 img/min, 2× RTX 4090 beats 1× A100',
    ],
  },
  {
    id: 'lora',
    icon: BookOpen,
    title: 'LoRA Fine-tuning',
    tagline: 'Parameter-efficient fine-tuning with QLoRA / Dreambooth',
    accentColor: 'text-amber-500',
    accentBg: 'bg-amber-50 dark:bg-amber-500/10',
    minVram: 24, minGpus: 1,
    preferredModels: [/A100/i, /H100/i, /L40S/i, /RTX.*4090/i, /A6000/i],
    storageGB: 250, egressGB: 10, hoursPerWeek: 30,
    stack: ['HF PEFT', 'bitsandbytes', 'Axolotl'],
    steps: [
      'Select ≥24GB VRAM (A6000/48GB ideal for 13B QLoRA)',
      'Install peft, bitsandbytes, transformers, accelerate',
      'Load base model in 4-bit NF4 quantization',
      'Attach LoRA adapters (r=16, alpha=32)',
      'Train with gradient checkpointing enabled',
    ],
    tips: [
      '48GB is the sweet spot — 13B full or 70B QLoRA',
      'Flash Attention 2 cuts memory 30–40%',
    ],
  },
  {
    id: 'llm-inference',
    icon: Zap,
    title: 'Llama 70B Inference',
    tagline: 'High-throughput LLM API with vLLM or TGI',
    accentColor: 'text-brand-500',
    accentBg: 'bg-brand-50 dark:bg-brand-400/10',
    minVram: 80, minGpus: 2,
    preferredModels: [/H100/i, /A100.*80/i, /H200/i],
    storageGB: 200, egressGB: 50, hoursPerWeek: 168,
    stack: ['vLLM', 'TGI', 'FastAPI'],
    steps: [
      'Provision 2× H100 80GB or 4× A100 40GB',
      'Install vLLM: pip install vllm',
      'Download model weights (~137GB)',
      'Start with --tensor-parallel-size 2',
      'Benchmark: target >100 tok/sec/user',
    ],
    tips: [
      '2× H100 SXM: ~600 tok/s for Llama 70B',
      'vLLM PagedAttention cuts waste 20–30%',
    ],
  },
  {
    id: 'llm-training',
    icon: Cpu,
    title: 'LLM Pre-training',
    tagline: 'Multi-GPU training with DeepSpeed or FSDP',
    accentColor: 'text-sky-500',
    accentBg: 'bg-sky-50 dark:bg-sky-500/10',
    minVram: 80, minGpus: 4,
    preferredModels: [/H100.*SXM/i, /H200/i, /A100.*80/i],
    storageGB: 1000, egressGB: 100, hoursPerWeek: 168,
    stack: ['DeepSpeed', 'FSDP', 'W&B'],
    steps: [
      'Provision 4–8× H100 SXM with NVLink',
      'Configure DeepSpeed ZeRO-3 sharding',
      'Enable gradient checkpointing + bf16',
      'Use streaming datasets (avoid disk bottleneck)',
      'Checkpoint every N steps to persistent storage',
    ],
    tips: [
      'NVLink is critical: 900 GB/s vs PCIe 64 GB/s',
      'Spot + checkpoint-resume saves 40–70%',
    ],
  },
  {
    id: 'video-gen',
    icon: Video,
    title: 'Video Generation',
    tagline: 'CogVideoX, Mochi, LTX-Video',
    accentColor: 'text-rose-500',
    accentBg: 'bg-rose-50 dark:bg-rose-500/10',
    minVram: 24, minGpus: 1,
    preferredModels: [/H100/i, /A100.*80/i, /RTX.*4090/i, /L40S/i],
    storageGB: 300, egressGB: 100, hoursPerWeek: 40,
    stack: ['CogVideoX', 'diffusers', 'FFMPEG'],
    steps: [
      'Provision ≥24GB VRAM (A100 80GB recommended)',
      'Install diffusers, transformers, accelerate',
      'Use fp16/bf16 for larger models',
      'Generate in batches — video is memory-heavy',
      'Post-process with FFMPEG for delivery',
    ],
    tips: [
      'Video needs 4–8× the VRAM of image gen',
      'NVMe storage critical — multi-GB per video',
    ],
  },
];

// ── Recipe Card ───────────────────────────────────────────────────────────────

const RecipeCard: React.FC<{
  recipe: Recipe;
  gpuData: GPUInstance[];
}> = ({ recipe, gpuData }) => {
  const [expanded, setExpanded] = useState(false);

  const matches = useMemo(() => {
    if (!gpuData.length) return [];
    return gpuData
      .filter((d) =>
        d.vram * d.gpuCount >= recipe.minVram &&
        d.gpuCount >= recipe.minGpus &&
        d.availability !== Availability.Out &&
        d.commitment !== Commitment.Spot
      )
      .sort((a, b) => a.pricePerHour - b.pricePerHour)
      .slice(0, 3);
  }, [gpuData, recipe]);

  const best = matches[0];
  const tmc = best ? calcTMC(best, recipe.hoursPerWeek, recipe.storageGB, recipe.egressGB) : null;

  return (
    <div className="bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 transition-all">

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className={`p-2 rounded-lg ${recipe.accentBg} shrink-0`}>
            <recipe.icon className={`h-4 w-4 ${recipe.accentColor}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-tight">{recipe.title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{recipe.tagline}</p>
          </div>
        </div>

        {/* Requirements — compact line */}
        <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-0.5"><MemoryStick className="h-3 w-3" /> {recipe.minVram}GB+</span>
          {recipe.minGpus > 1 && <span className="flex items-center gap-0.5"><Cpu className="h-3 w-3" /> ×{recipe.minGpus}+</span>}
          <span className="flex items-center gap-0.5"><HardDrive className="h-3 w-3" /> ~{recipe.storageGB}GB</span>
          <span className="ml-auto font-mono">{recipe.stack.join(' · ')}</span>
        </div>
      </div>

      {/* GPU matches */}
      {matches.length > 0 ? (
        <div className="border-t border-slate-100 dark:border-ink-border bg-slate-50 dark:bg-white/3 px-4 py-3">
          <div className="space-y-1.5">
            {matches.map((g, i) => {
              const score = getContinuityScore(g);
              const label = getContinuityLabel(score);
              const itemTmc = calcTMC(g, recipe.hoursPerWeek, recipe.storageGB, recipe.egressGB);
              return (
                <div key={g.id} className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                  i === 0
                    ? 'bg-brand-50 dark:bg-brand-400/10 border border-brand-200 dark:border-brand-400/20'
                    : 'bg-white dark:bg-white/5 border border-slate-100 dark:border-ink-border'
                }`}>
                  <div className="flex items-center gap-2 min-w-0">
                    {i === 0 && <span className="text-[9px] font-bold bg-brand-400 text-white px-1.5 py-0.5 rounded shrink-0">BEST</span>}
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white truncate block">
                        {g.model}{g.gpuCount > 1 ? ` ×${g.gpuCount}` : ''} — {g.provider}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${label.bg}`}>{label.label}</span>
                    <span className="text-xs font-bold font-mono text-slate-900 dark:text-white">${itemTmc.totalMonthly.toFixed(0)}/mo</span>
                    <a href={g.link} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border-t border-slate-100 dark:border-ink-border px-4 py-3 text-xs text-slate-400 bg-slate-50 dark:bg-white/3">
          No live matches — check back soon.
        </div>
      )}

      {/* Expandable guide */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-colors border-t border-slate-100 dark:border-ink-border"
      >
        Setup guide
        {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-ink-border pt-3">
          <ol className="space-y-1.5">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <span className="shrink-0 text-[10px] font-bold text-slate-400 w-4 text-right">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
          <div className="space-y-1">
            {recipe.tips.map((tip, i) => (
              <p key={i} className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                <span className={`${recipe.accentColor} mr-1`}>›</span>{tip}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Page ──────────────────────────────────────────────────────────────────────

interface WorkloadRecipesPageProps {
  data: GPUInstance[];
  isLoading: boolean;
}

export const WorkloadRecipesPage: React.FC<WorkloadRecipesPageProps> = ({ data, isLoading }) => (
  <div className="fade-up">
    <div className="mb-6">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">Workload Recipes</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
        Setup guides for common ML workloads with live GPU picks and true monthly cost estimates.
      </p>
    </div>

    {isLoading ? (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-40 bg-white dark:bg-ink-card rounded-xl border border-slate-200 dark:border-ink-border animate-pulse" />
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {RECIPES.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} gpuData={data} />
        ))}
      </div>
    )}

    <p className="mt-6 text-[10px] text-slate-400 dark:text-slate-500 text-center max-w-md mx-auto">
      Cost estimates use specified hours/week + storage + egress. Spot excluded. Verify availability before long runs.
    </p>
  </div>
);
