import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { CreditCard, Search, Shield, CheckCircle, ExternalLink } from "lucide-react";

interface ConnectBankModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const popularBanks = [
  { name: "Chase", logo: "🏦", connected: false },
  { name: "Bank of America", logo: "🏛️", connected: false },
  { name: "Wells Fargo", logo: "🏪", connected: false },
  { name: "Citi", logo: "🏢", connected: false },
  { name: "Capital One", logo: "💳", connected: true },
  { name: "American Express", logo: "💎", connected: false },
];

export function ConnectBankModal({ open, onOpenChange }: ConnectBankModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  const filteredBanks = popularBanks.filter(bank =>
    bank.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBankSelect = (bankName: string) => {
    setSelectedBank(bankName);
  };

  const handleConnect = () => {
    // Mock Plaid Link initialization
    console.log(`Initiating Plaid Link for ${selectedBank}...`);
    
    // In a real app, this would open Plaid Link
    // const linkHandler = Plaid.create({
    //   token: linkToken,
    //   onSuccess: (publicToken, metadata) => {
    //     // Exchange public token for access token
    //   },
    //   onExit: (err, metadata) => {
    //     // Handle exit
    //   }
    // });
    // linkHandler.open();
    
    // Mock success for demo
    setTimeout(() => {
      alert(`Successfully connected to ${selectedBank} via Plaid!`);
      onOpenChange(false);
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Connect Bank Account
          </DialogTitle>
          <DialogDescription>
            Securely connect your bank accounts to track transactions and balances automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Plaid Security Notice */}
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Powered by Plaid</h4>
                <p className="text-sm text-blue-700">
                  We use Plaid's bank-grade security. Your login credentials are encrypted 
                  and never stored by us. Plaid is trusted by over 11,000 financial apps.
                </p>
                <a 
                  href="https://plaid.com/security" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 mt-1"
                >
                  Learn about Plaid's security <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </div>
            </div>
          </Card>

          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="bank-search">Search for your bank</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="bank-search"
                placeholder="Search banks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Bank List */}
          <div className="space-y-2">
            <Label>Popular Banks</Label>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {filteredBanks.map((bank) => (
                <Card
                  key={bank.name}
                  className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedBank === bank.name ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                  } ${bank.connected ? 'opacity-50' : ''}`}
                  onClick={() => !bank.connected && handleBankSelect(bank.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{bank.logo}</span>
                      <span className="font-medium">{bank.name}</span>
                    </div>
                    {bank.connected ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      selectedBank === bank.name && (
                        <Badge variant="secondary">Selected</Badge>
                      )
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Manual Entry */}
          <div className="space-y-2">
            <Label>Can't find your bank?</Label>
            <Button variant="outline" className="w-full">
              Enter bank details manually
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleConnect} 
            disabled={!selectedBank}
          >
            Connect {selectedBank}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}