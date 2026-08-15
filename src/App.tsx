import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import Landing from "./pages/Landing.tsx";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import PublishedSite from "./pages/PublishedSite.tsx";
import ApiDocs from "./pages/ApiDocs.tsx";
import CodeApi from "./pages/CodeApi.tsx";
import VoicePage from "./pages/VoicePage.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    try {
      if (Capacitor.isNativePlatform()) {
        CapApp.addListener("appUrlOpen", async (event) => {
          const url = event.url;
          if (url.includes("#access_token=")) {
            const hash = url.split("#")[1];
            const params = new URLSearchParams(hash);
            const access_token = params.get("access_token");
            const refresh_token = params.get("refresh_token");
            
            if (access_token && refresh_token) {
              await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              window.location.hash = "";
            }
          }
        }).catch(() => {});
      }
    } catch {}
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/site/:id" element={<PublishedSite />} />
          <Route path="/api-docs" element={<CodeApi />} />
          <Route path="/codeapi" element={<CodeApi />} />
          <Route path="/voice" element={<VoicePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;

