import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ExternalLink, Heart } from 'lucide-react';

interface DonationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DonationModal({ open, onOpenChange }: DonationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Support ForgetFunds
          </DialogTitle>
          <DialogDescription>
            Thank you for considering supporting the development of ForgetFunds! 
            Your contribution helps keep this project free and open-source.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-3">
            <Button 
              variant="outline" 
              onClick={() => window.open('https://github.com/sponsors/angelo-hub', '_blank')}
              className="w-full justify-start"
            >
              <Heart className="mr-2 h-4 w-4 text-red-500" />
              Sponsor on GitHub
              <ExternalLink className="ml-auto h-3 w-3" />
            </Button>
            
            <Button 
              variant="outline" 
              onClick={() => window.open('https://buymeacoffee.com/angelo.girardi', '_blank')}
              className="w-full justify-start"
            >
              ☕ Buy me a coffee
              <ExternalLink className="ml-auto h-3 w-3" />
            </Button>
          </div>
          
          <div className="rounded-lg bg-muted p-4">
            <p className="text-sm text-muted-foreground">
              💡 <strong>GitHub Sponsors</strong> is great for ongoing monthly support, 
              while <strong>Buy Me A Coffee</strong> is perfect for one-time contributions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
