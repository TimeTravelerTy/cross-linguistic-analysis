import React from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from 'lucide-react';

interface InfoTooltipProps {
  content: string | React.ReactNode;
  children?: React.ReactNode;
  showIcon?: boolean;
  className?: string;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({ 
  content, 
  children, 
  showIcon = true,
  className = "" 
}) => {
  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger className={className}>
          <span className="inline-flex items-center gap-1">
            {children}
            {showIcon && (
              <Info className="h-4 w-4 text-stone-400 transition-colors hover:text-slate-700" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="text-sm leading-6">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InfoTooltip;
