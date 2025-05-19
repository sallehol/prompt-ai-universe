
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner"; // Renamed to avoid conflict
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import IndexPage from "./pages/Index";
import ModelCatalogPage from "./pages/ModelCatalogPage";
import PricingPage from "./pages/PricingPage";
import NotFound from "./pages/NotFound";
import UserProfilePage from "./pages/UserProfilePage"; // New
import ForgotPasswordPage from "./pages/ForgotPasswordPage"; // New
import ResetPasswordPage from "./pages/ResetPasswordPage"; // New
import AuthCallbackPage from "./pages/AuthCallbackPage"; // New for OAuth

import { AuthProvider } from "./contexts/AuthContext"; // New

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <SonnerToaster /> {/* Use renamed import */}
      <BrowserRouter>
        <AuthProvider> {/* AuthProvider wraps routes */}
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<IndexPage />} />
              <Route path="/models" element={<ModelCatalogPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/profile" element={<UserProfilePage />} /> 
              {/* ADD ALL CUSTOM ROUTES INSIDE LAYOUT ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Route>
            {/* Routes outside main Layout (e.g. for full screen auth pages if needed) */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
