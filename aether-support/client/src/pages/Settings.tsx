import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Save, Phone, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [accountSid, setAccountSid] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [twimlAppSid, setTwimlAppSid] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const settingsQuery = trpc.twilio.getSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const saveMutation = trpc.twilio.saveSettings.useMutation({
    onSuccess: () => {
      settingsQuery.refetch();
      toast.success("Twilio settings saved successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to save settings: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settingsQuery.data) {
      setAccountSid(settingsQuery.data.accountSid || "");
      setAuthToken(settingsQuery.data.authToken || "");
      setTwimlAppSid(settingsQuery.data.twimlAppSid || "");
      setPhoneNumber(settingsQuery.data.phoneNumber || "");
    }
  }, [settingsQuery.data]);

  const handleSave = () => {
    if (!accountSid || !authToken || !twimlAppSid || !phoneNumber) {
      toast.error("Please fill in all Twilio credentials");
      return;
    }
    saveMutation.mutate({
      accountSid,
      authToken,
      twimlAppSid,
      phoneNumber,
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access settings</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <a href={getLoginUrl()}>Log In</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Settings</h1>
          <p className="text-slate-600">Configure your Twilio VoIP integration</p>
        </div>

        <Alert className="mb-6">
          <Phone className="h-4 w-4" />
          <AlertDescription>
            To enable voice calling, you need a Twilio account. Sign up at{" "}
            <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              twilio.com/try-twilio
            </a>{" "}
            (free trial with $15 credit available).
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Twilio VoIP Configuration
            </CardTitle>
            <CardDescription>
              Enter your Twilio credentials to enable voice calling functionality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {settingsQuery.isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="accountSid">Account SID *</Label>
                    <Input
                      id="accountSid"
                      placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={accountSid}
                      onChange={(e) => setAccountSid(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Found in your Twilio Console Dashboard
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="authToken">Auth Token *</Label>
                    <Input
                      id="authToken"
                      type="password"
                      placeholder="••••••••••••••••••••••••••••••••"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Found in your Twilio Console Dashboard (click "Show" to reveal)
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="twimlAppSid">TwiML App SID *</Label>
                    <Input
                      id="twimlAppSid"
                      placeholder="APxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={twimlAppSid}
                      onChange={(e) => setTwimlAppSid(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Create a TwiML App in Console → Voice → TwiML Apps
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Twilio Phone Number *</Label>
                    <Input
                      id="phoneNumber"
                      placeholder="+1234567890"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Purchase a phone number from Console → Phone Numbers → Buy a Number
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t">
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="flex items-center gap-2"
                  >
                    {saveMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Settings
                  </Button>
                  {settingsQuery.data?.isConfigured && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                      Twilio configured
                    </div>
                  )}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Security Note:</strong> Your credentials are encrypted and stored securely. 
                    Never share your Auth Token with anyone.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Setup Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm text-slate-700">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">1.</span>
                <span>Sign up for a Twilio account at <a href="https://www.twilio.com/try-twilio" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">twilio.com/try-twilio</a></span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">2.</span>
                <span>Copy your Account SID and Auth Token from the Twilio Console Dashboard</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">3.</span>
                <span>Create a TwiML App: Go to Console → Voice → TwiML Apps → Create new TwiML App</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">4.</span>
                <span>Purchase a phone number: Go to Console → Phone Numbers → Buy a Number</span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600 flex-shrink-0">5.</span>
                <span>Enter all credentials above and click "Save Settings"</span>
              </li>
            </ol>
          </CardContent>
        </Card>
    </div>
  );
}
