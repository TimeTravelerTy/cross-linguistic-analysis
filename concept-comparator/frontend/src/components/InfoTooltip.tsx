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
              <Info className="w-4 h-4 text-gray-400 hover:text-gray-600 transition-colors" />
            )}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default InfoTooltip;