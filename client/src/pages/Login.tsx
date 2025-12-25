import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogIn } from "lucide-react";
import { APP_CONFIG } from "@/config/app";

const REMEMBER_USERNAME_KEY = "rememberedUsername";
const REMEMBER_ME_KEY = "rememberMe";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [rememberMe, setRememberMe] = useState(false);

  // Load saved username on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem(REMEMBER_USERNAME_KEY);
    const savedRememberMe = localStorage.getItem(REMEMBER_ME_KEY) === "true";

    if (savedUsername && savedRememberMe) {
      setCredentials(prev => ({ ...prev, username: savedUsername }));
      setRememberMe(true);
    }
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    login(credentials, {
      onSuccess: () => {
        // Save username if "Remember Me" is checked
        if (rememberMe) {
          localStorage.setItem(REMEMBER_USERNAME_KEY, credentials.username);
          localStorage.setItem(REMEMBER_ME_KEY, "true");
        } else {
          localStorage.removeItem(REMEMBER_USERNAME_KEY);
          localStorage.removeItem(REMEMBER_ME_KEY);
        }

        toast({ title: "Login successful" });
        setLocation("/");
      },
      onError: (error: Error) => {
        toast({
          title: "Login failed",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">{APP_CONFIG.name}</CardTitle>
          <CardDescription>Sign in to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={(e) =>
                  setCredentials({ ...credentials, username: e.target.value })
                }
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={(e) =>
                  setCredentials({ ...credentials, password: e.target.value })
                }
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Remember my username
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoggingIn}
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isLoggingIn ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
