import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card } from "./ui/card";
import { Shield, FileText, Download, Trash2 } from "lucide-react";

interface PrivacyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PrivacyModal({ open, onOpenChange }: PrivacyModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Privacy & Data Control
          </DialogTitle>
          <DialogDescription>
            Manage your data privacy and understand how your information is used.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="privacy" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
            <TabsTrigger value="terms">Terms of Service</TabsTrigger>
            <TabsTrigger value="data">Data Control</TabsTrigger>
          </TabsList>

          <TabsContent value="privacy" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">How We Protect Your Privacy</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Data We Collect</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Account information (name, email)</li>
                    <li>Financial data via secure bank connections</li>
                    <li>Transaction history and spending patterns</li>
                    <li>Budget preferences and goals</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">How We Use Your Data</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Provide personalized budgeting insights</li>
                    <li>Calculate safe-to-spend amounts</li>
                    <li>Track progress toward financial goals</li>
                    <li>Improve our AI recommendations</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Data Security</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Bank-grade 256-bit SSL encryption</li>
                    <li>Secure data storage with regular backups</li>
                    <li>No sharing with third parties for marketing</li>
                    <li>Regular security audits and updates</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="terms" className="space-y-4">
            <Card className="p-6">
              <h3 className="font-semibold mb-4">Terms of Service</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Service Agreement</h4>
                  <p className="text-muted-foreground">
                    By using Budget, you agree to these terms and conditions. Our service provides 
                    financial management tools and AI-powered insights to help you manage your money better.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Acceptable Use</h4>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Use the service for personal financial management only</li>
                    <li>Provide accurate information for your accounts</li>
                    <li>Do not attempt to access other users' data</li>
                    <li>Report any security issues immediately</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Limitations</h4>
                  <p className="text-muted-foreground">
                    Budget provides financial insights and recommendations but is not a substitute 
                    for professional financial advice. We are not responsible for financial decisions 
                    made based on our recommendations.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <div className="grid gap-4">
              <Card className="p-6">
                <h3 className="font-semibold mb-4">Your Data Rights</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Export Your Data</h4>
                      <p className="text-sm text-muted-foreground">
                        Download all your financial data in JSON format
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Delete Your Account</h4>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data
                      </p>
                    </div>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="font-semibold mb-4">Data Storage</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Account created:</span>
                    <span className="font-medium">March 15, 2024</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last login:</span>
                    <span className="font-medium">Today</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Connected accounts:</span>
                    <span className="font-medium">2 accounts</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total transactions:</span>
                    <span className="font-medium">1,247 transactions</span>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4">
          <Button onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}