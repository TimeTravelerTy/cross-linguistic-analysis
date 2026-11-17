import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const ITEM = 'rounded-[16px] border border-stone-200/80 bg-white/70 px-4';
const TRIGGER = 'py-3 text-sm font-semibold text-slate-900';
const BODY = 'space-y-2 pb-3 text-sm leading-6 text-slate-700';
const LINK = 'font-semibold text-sky-800 hover:text-sky-950';

export default function InfoPanel() {
  return (
    <div className="atlas-panel p-5">
      <h3 className="mb-3 text-lg text-slate-900">About the data</h3>

      <Accordion type="single" collapsible className="w-full space-y-2">
        <AccordionItem value="colex" className={ITEM}>
          <AccordionTrigger className={TRIGGER}>What is colexification?</AccordionTrigger>
          <AccordionContent>
            <div className={BODY}>
              <p>
                A language <em>colexifies</em> two concepts when one word covers both. Russian
                <em> рука</em> means both HAND and ARM, while English keeps them apart.
              </p>
              <p>
                Colexifications that recur across unrelated families hint at how people
                conceptualise the world, rather than at shared history.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="sources" className={ITEM}>
          <AccordionTrigger className={TRIGGER}>Sources</AccordionTrigger>
          <AccordionContent>
            <div className={BODY}>
              <p>
                Colexifications come from{' '}
                <a className={LINK} href="https://clics.clld.org/" target="_blank" rel="noopener noreferrer">
                  CLICS³
                </a>{' '}
                (network of colexifications attested in at least 3 families). Concepts are
                identified with{' '}
                <a className={LINK} href="https://concepticon.clld.org/" target="_blank" rel="noopener noreferrer">
                  Concepticon
                </a>{' '}
                IDs; families follow Glottolog.
              </p>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="views" className={ITEM}>
          <AccordionTrigger className={TRIGGER}>Reading the results</AccordionTrigger>
          <AccordionContent>
            <dl className={BODY}>
              <div>
                <dt className="font-semibold text-slate-800">Overview</dt>
                <dd>Pair matrix: languages and families with one word for both concepts, and how similar the concepts' CLICS neighbourhoods are.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Families</dt>
                <dd>Attesting languages per family for one pair. The percentage is relative to that family's languages in CLICS.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Semantic chains</dt>
                <dd>Indirect links such as WIND → AIR → BREATH → SOUL, where each step is a colexification even if the ends are not.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Network</dt>
                <dd>The concepts in their CLICS neighbourhood. Thicker edges mean more languages. Drag nodes to rearrange.</dd>
              </div>
              <div>
                <dt className="font-semibold text-slate-800">Languages</dt>
                <dd>Each attesting language with the concepts it merges and the actual word form.</dd>
              </div>
            </dl>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
