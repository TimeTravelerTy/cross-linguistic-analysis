import React from 'react';
import { BookOpen, GitGraph, Globe2, Info, Network } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface InfoPanelProps {
  className?: string;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ className = '' }) => {
  return (
    <div className={`atlas-panel p-6 ${className}`}>
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-full bg-sky-100 p-2 text-sky-950">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <p className="atlas-label mb-1">Reference</p>
          <h2 className="text-2xl text-slate-950">Reading the results</h2>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Use this panel as a compact guide to the concepts, evidence, and result views.
          </p>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full space-y-3">
        <AccordionItem value="concepts" className="rounded-[20px] border border-stone-200/80 bg-white/70 px-4">
          <AccordionTrigger className="text-base font-semibold text-slate-950">Concepts &amp; Concepticon</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-2 pt-1 text-sm leading-6 text-slate-700">
              <div className="flex gap-3">
                <BookOpen className="mt-1 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <p>
                    Each concept is pinned to a <span className="font-medium text-slate-800">Concepticon ID</span> — a canonical
                    cross-linguistic concept list used in comparative linguistics. This ensures "HAND" in one dataset
                    means the same thing as "HAND" in another.
                  </p>
                  <a
                    href="https://concepticon.clld.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-sky-800 hover:text-sky-950"
                  >
                    Concepticon →
                  </a>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="colex" className="rounded-[20px] border border-stone-200/80 bg-white/70 px-4">
          <AccordionTrigger className="text-base font-semibold text-slate-950">What is colexification?</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pb-2 pt-1 text-sm leading-6 text-slate-700">
              <div className="flex gap-3">
                <Globe2 className="mt-1 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <p>
                    Two concepts are <span className="font-medium text-slate-800">colexified</span> in a language when the same
                    word covers both. English uses different words for HAND and ARM, but Turkish uses one word (<em>el</em>)
                    for HAND and a different one for ARM — while many other languages colexify them.
                  </p>
                  <p className="mt-2">
                    Colexification patterns reveal cognitive and cultural categorisation differences across languages.
                    All data comes from <span className="font-medium text-slate-800">CLICS</span> (Database of Cross-Linguistic
                    Colexifications), which covers 3,000+ languages.
                  </p>
                  <a
                    href="https://clics.clld.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-sky-800 hover:text-sky-950"
                  >
                    CLICS database →
                  </a>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="views" className="rounded-[20px] border border-stone-200/80 bg-white/70 px-4">
          <AccordionTrigger className="text-base font-semibold text-slate-950">Understanding the views</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1 text-sm leading-6 text-slate-700">
              <div className="flex gap-3">
                <GitGraph className="mt-1 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <h3 className="font-semibold text-slate-800">Family Patterns</h3>
                  <p>Bar chart of direct colexification rate per language family. Rate = languages in that family
                  that share one word for the pair / total CLICS languages in that family. Chips below each bar
                  show the specific CLICS language codes that attest the colexification.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Network className="mt-1 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <h3 className="font-semibold text-slate-800">Concept Network</h3>
                  <p>Force-directed graph of your selected concepts within their CLICS colexification neighbourhood.
                  Edge thickness = number of attesting languages. Use the family filter to highlight edges attested
                  in a specific family. Drag nodes to rearrange the layout.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Globe2 className="mt-1 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <h3 className="font-semibold text-slate-800">Language Details</h3>
                  <p>Per-language merge/split cards for languages in your selected families.
                  Only languages that actually attest at least one colexification appear here —
                  select families above to populate this view.</p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="families" className="rounded-[20px] border border-stone-200/80 bg-white/70 px-4">
          <AccordionTrigger className="text-base font-semibold text-slate-950">Language families</AccordionTrigger>
          <AccordionContent>
            <div className="pb-2 pt-1 text-sm leading-6 text-slate-700">
              <p>
                The family filter is optional. Without selecting any families, the Family Patterns
                view shows the full CLICS sample. Selecting specific families narrows the detailed
                language evidence in the Language Details tab.
              </p>
              <p className="mt-2">
                Family membership follows CLICS's own classification, which is based on Glottolog.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default InfoPanel;
