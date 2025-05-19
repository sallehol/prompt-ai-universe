
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import IndexPage from "./pages/Index";
import ModelCatalogPage from "./pages/ModelCatalogPage";
import PricingPage from "./pages/PricingPage";
import NotFound from "./pages/NotFound";
import UserProfilePage from "./pages/UserProfilePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
// import AuthCallbackPage from "./pages/AuthCallbackPage"; // Old import, will be removed
import AuthCallback from "./components/AuthCallback"; // New import

import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <SonnerToaster />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<IndexPage />} />
              <Route path="/models" element={<ModelCatalogPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/profile" element={<UserProfilePage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            {/* Use the new AuthCallback component */}
            <Route path="/auth/callback" element={<AuthCallback />} /> 
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

