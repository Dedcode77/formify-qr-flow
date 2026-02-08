import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import FormsList from "./pages/FormsList";
import FormBuilder from "./pages/FormBuilder";
import FormResponses from "./pages/FormResponses";
import Analytics from "./pages/Analytics";
import Attendance from "./pages/Attendance";
import PublicForm from "./pages/PublicForm";
import Settings from "./pages/Settings";
import Team from "./pages/Team";
import Pricing from "./pages/Pricing";
import AcceptInvite from "./pages/AcceptInvite";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/forms" element={<FormsList />} />
          <Route path="/dashboard/forms/new" element={<FormBuilder />} />
          <Route path="/dashboard/forms/:id" element={<FormBuilder />} />
          <Route path="/dashboard/forms/:id/responses" element={<FormResponses />} />
          <Route path="/dashboard/analytics" element={<Analytics />} />
          <Route path="/dashboard/attendance" element={<Attendance />} />
          <Route path="/dashboard/settings" element={<Settings />} />
          <Route path="/dashboard/team" element={<Team />} />
          <Route path="/f/:slug" element={<PublicForm />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
