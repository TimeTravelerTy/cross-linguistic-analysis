import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import { Info, Brain, Network, GitGraph, AlertTriangle } from 'lucide-react';

interface InfoPanelProps {
    className?: string;
}

const InfoPanel: React.FC<InfoPanelProps> = ({ className = "" }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 ${className}`}>
      <div className="flex items-start gap-3 mb-6">
        <Info className="w-5 h-5 mt-1 text-blue-500 flex-shrink-0" />
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            About This Tool
          </h2>
          <p className="text-gray-600 mt-1">
            This tool compares how different languages encode semantic relationships between concepts,
            using multiple approaches including AI-powered translations, cross-lingual embeddings,
            and colexification data.
          </p>
        </div>
      </div>

      <Alert className="mb-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Important Note</AlertTitle>
        <AlertDescription>
          Translations are generated using the configured AI translation model. While generally accurate,
          they may occasionally contain errors or miss nuanced cultural contexts. For critical
          research, please verify translations with native speakers or linguistic resources.
        </AlertDescription>
      </Alert>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="process">
          <AccordionTrigger className="text-base font-medium">
            How It Works
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2">
              <div className="flex gap-3">
                <Brain className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium mb-1">AI-Powered Translation</h3>
                  <p className="text-gray-600 text-sm">
                    The translation model generates context-specific variations
                    and usage notes. Each translation considers grammatical and cultural
                    requirements of the target language.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Network className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium mb-1">Semantic Comparison</h3>
                  <p className="text-gray-600 text-sm">
                    LaBSE (Language-agnostic BERT Sentence Embeddings) compares concepts by
                    analyzing full contextual strings: "[translation] ([language], meaning [concept])".
                    This approach provides better results than comparing single words.
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    <a 
                      href="https://arxiv.org/abs/2007.01852"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Learn more about LaBSE
                    </a>
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <GitGraph className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium mb-1">Cross-linguistic Patterns</h3>
                  <p className="text-gray-600 text-sm">
                    CLICS (Database of Cross-Linguistic Colexifications) data reveals how
                    concepts share words (by homophony or polysemy) across language families. Family graphs show connections
                    if any language in the family exhibits the relationship.
                  </p>
                  <p className="text-gray-600 text-sm mt-2">
                    <a 
                      href="https://clics.clld.org/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Learn more about CLICS
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="scores">
          <AccordionTrigger className="text-base font-medium">
            Understanding the Scores
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2">
              <div>
                <h3 className="font-medium mb-2">Embedding Similarity</h3>
                <p className="text-gray-600 text-sm">
                  Shows how semantically close two concepts are in a language based on
                  their usage in real texts. Ranges from 0% (completely different) to
                  100% (identical meaning contexts).
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Direct Colexification</h3>
                <p className="text-gray-600 text-sm">
                  The percentage of languages in a family that use the same word for
                  both concepts. A higher score suggests a stronger historical or
                  cognitive connection.
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">Total Colexical Score</h3>
                <p className="text-gray-600 text-sm">
                  Combines direct colexification with semantic chain data. Chains show
                  indirect connections (e.g., A→B→C), weighted by path length and
                  frequency. This provides a more complete picture of semantic relationships.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="modes">
          <AccordionTrigger className="text-base font-medium">
            WordNet vs. CLICS Modes
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 py-2">
              <div>
                <h3 className="font-medium mb-2">WordNet Mode</h3>
                <p className="text-gray-600 text-sm">
                  Uses Princeton WordNet's comprehensive English word sense database.
                  Ideal for precise meaning disambiguation when starting from English
                  concepts.
                </p>
                <p className="text-gray-600 text-sm mt-2">
                  <a 
                    href="https://wordnet.princeton.edu/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Learn more about WordNet
                  </a>
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2">CLICS Mode</h3>
                <p className="text-gray-600 text-sm">
                  Uses concepts from the CLICS database, ensuring cross-linguistic
                  validity. Better for concepts known to have interesting patterns
                  across languages.
                </p>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default InfoPanel;
