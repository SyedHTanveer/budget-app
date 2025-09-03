import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Bell, Shield, Palette, CreditCard } from "lucide-react";
import { useGetPreferencesQuery, useUpdatePreferencesMutation } from '../store/api';
import { useEffect, useState } from 'react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { data: prefsData } = useGetPreferencesQuery(undefined, { skip: !open });
  const [updatePrefs, { isLoading: saving }] = useUpdatePreferencesMutation();
  const prefs = prefsData?.preferences || {};
  const [currency, setCurrency] = useState('USD');
  const [theme, setTheme] = useState('light');
  const [aiOptIn, setAiOptIn] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(()=>{
    if (prefsData?.preferences) {
      setCurrency(prefs.default_currency || 'USD');
      setTheme(prefs.theme || 'light');
      setAiOptIn(!!prefs.ai_opt_in);
      setEmailAlerts(!!prefs.notifications_email);
    }
  }, [prefsData]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Manage your account settings and preferences.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <div className="space-y-4">
              {/* Replace static fields with editable preference subset */}
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" value={currency} onChange={e=> setCurrency(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Input id="theme" value={theme} onChange={e=> setTheme(e.target.value)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Assistant</Label>
                  <p className="text-sm text-muted-foreground">Enable conversational budgeting guidance</p>
                </div>
                <Switch checked={aiOptIn} onCheckedChange={setAiOptIn} />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Alerts</Label>
                  <p className="text-sm text-muted-foreground">Receive spending & goal notifications</p>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bill Reminders</Label>
                  <p className="text-sm text-muted-foreground">Get notified before bills are due</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Goal Updates</Label>
                  <p className="text-sm text-muted-foreground">Notifications when you reach savings milestones</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Spending Alerts</Label>
                  <p className="text-sm text-muted-foreground">Alerts when you exceed spending limits</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Weekly Summary</Label>
                  <p className="text-sm text-muted-foreground">Weekly financial summary emails</p>
                </div>
                <Switch />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Biometric Login</Label>
                  <p className="text-sm text-muted-foreground">Use fingerprint or face recognition</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">Switch to dark theme</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">Show more content on screen</p>
                </div>
                <Switch />
              </div>
              <div className="space-y-2">
                <Label>Language</Label>
                <Input defaultValue="English" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={async () => { await updatePrefs({ default_currency: currency, theme, ai_opt_in: aiOptIn, notifications_email: emailAlerts }).unwrap(); onOpenChange(false); }} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}