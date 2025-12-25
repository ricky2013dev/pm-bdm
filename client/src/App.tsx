import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/Dashboard";
import StudentList from "@/pages/StudentList";
import StudentDetail from "@/pages/StudentDetail";
import AddStudent from "@/pages/AddStudent";
import BulkImport from "@/pages/BulkImport";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/students" component={StudentList} />
      <Route path="/students/new" component={AddStudent} />
      <Route path="/students/import" component={BulkImport} />
      <Route path="/students/:id" component={StudentDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
