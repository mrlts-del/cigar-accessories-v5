import React from 'react';
import { Loader2 } from 'lucide-react'; // Using lucide-react for icons, common with ShadCN

interface LoadingContentProps {
  description?: string;
  size?: number; // Size of the loader icon
}

const LoadingContent: React.FC<LoadingContentProps> = ({
  description = 'Loading...',
  size = 24,
}) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 p-4">
      <Loader2 className="h-6 w-6 animate-spin text-primary" style={{ height: size, width: size }} />
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
};

export default LoadingContent;