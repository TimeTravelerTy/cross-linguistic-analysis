import { AlertTriangle, Brain, GitGraph, Info, Network } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

interface InfoPanelProps {
  className?: string;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ className = '' }) => {
  return (
    <div className={`atlas-panel p-6 ${className}`}>
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-full bg-sky-100 p-2 text-sky-900">
          <Info className="h-5 w-5" />
        </div>
        <div>
          <p className="atlas-label mb-1">Reference</p>
          <h2 className="text-2xl text-slate-900">How Atlas Lab reads a comparison</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            This tool compares how languages encode conceptual relationships using AI-generated translations,
            contextual embeddings, and colexification evidence.
          </p>
        </div>
      </div>

      <Alert className="mb-6 rounded-[22px] border-amber-200 bg-amber-50/90 text-amber-950">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Interpretation note</AlertTitle>
        <AlertDescription>
          Machine-generated translations are useful for pattern finding, but they can miss cultural nuance. For
          high-stakes research, verify findings with native speakers or domain sources.
        </AlertDescription>
      </Alert>

      <Accordion type="single" collapsible className="w-full space-y-3">
        <AccordionItem value="process" className="rounded-[20px] border border-stone-200/80 bg-white/70 px-4">
          <AccordionTrigger className="text-base font-semibold text-slate-900">How It Works</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1">
              <div className="flex gap-3">
                <Brain className="mt-1 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <h3 className="font-semibold text-slate-900">AI-Powered Translation</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    The translation layer generates context-specific variants and usage notes tuned to the target
                    language.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Network className="mt-1 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <h3 className="font-semibold text-slate-900">Semantic Comparison</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    LaBSE embeddings compare the concepts in contextualized form, which is more informative than
                    comparing isolated words.
                  </p>
                  <a
                    href="https://arxiv.org/abs/2007.01852"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-sky-800 hover:text-sky-950"
                  >
                    Learn more about LaBSE
                  </a>
                </div>
              </div>

              <div className="flex gap-3">
                <GitGraph className="mt-1 h-5 w-5 flex-shrink-0 text-sky-700" />
                <div>
                  <h3 className="font-semibold text-slate-900">Cross-Linguistic Patterns</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    CLICS data reveals when concepts share lexical material across languages and families,
                    highlighting historical or cognitive relationships.
                  </p>
                  <a
                    href="https://clics.clld.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex text-sm font-semibold text-sky-800 hover:text-sky-950"
                  >
                    Learn more about CLICS
                  </a>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="scores" className="rounded-[20px] border border-stone-200/80 bg-white/70 px-4">
          <AccordionTrigger className="text-base font-semibold text-slate-900">Understanding the Scores</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1 text-sm leading-6 text-slate-600">
              <div>
                <h3 className="font-semibold text-slate-900">Embedding Similarity</h3>
                <p>Measures how close the concepts are in contextual semantic space, from 0% to 100%.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Direct Colexification</h3>
                <p>Shows how often a language family uses the same word for both concepts.</p>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Total Colexical Score</h3>
                <p>Combines direct colexification with indirect semantic chains to capture broader relationships.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="modes" className="rounded-[20px] border border-stone-200/80 bg-white/70 px-4">
          <AccordionTrigger className="text-base font-semibold text-slate-900">WordNet vs. CLICS</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pb-2 pt-1 text-sm leading-6 text-slate-600">
              <div>
                <h3 className="font-semibold text-slate-900">WordNet Mode</h3>
                <p>Use this when you want precise sense disambiguation from an English lexical database.</p>
                <a
                  href="https://wordnet.princeton.edu/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-flex font-semibold text-sky-800 hover:text-sky-950"
                >
                  Learn more about WordNet
                </a>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">CLICS Mode</h3>
                <p>Use this when you want concept choices that align with existing cross-linguistic datasets.</p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default InfoPanel;
