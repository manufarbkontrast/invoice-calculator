import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MonthDetail from "./pages/MonthDetail";
import Projects from "./pages/Projects";
import Analytics from "./pages/Analytics";
import Teams from "./pages/Teams";
import Settings from "./pages/Settings";
import ExportHistory from "./pages/ExportHistory";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/auth"} component={Auth} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/projects"} component={Projects} />
      <Route path={"/analytics"} component={Analytics} />
      <Route path={"/teams"} component={Teams} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/exports"} component={ExportHistory} />
      <Route path={"/month/:month"} component={MonthDetail} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </ErrorBoundary>
  );
}

export default App;
