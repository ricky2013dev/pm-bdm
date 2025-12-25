import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import StudentList from "@/pages/StudentList";
import StudentDetail from "@/pages/StudentDetail";
import AddStudent from "@/pages/AddStudent";
import BulkImport from "@/pages/BulkImport";
import UserManagement from "@/pages/UserManagement";

function Router() {
  return (
    <Switch>
      {/* Public route */}
      <Route path="/login" component={Login} />

      {/* Protected routes - require authentication */}
      <Route path="/">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>

      <Route path="/students">
        <ProtectedRoute>
          <StudentList />
        </ProtectedRoute>
      </Route>

      <Route path="/students/new">
        <ProtectedRoute>
          <AddStudent />
        </ProtectedRoute>
      </Route>

      <Route path="/students/import">
        <ProtectedRoute>
          <BulkImport />
        </ProtectedRoute>
      </Route>

      <Route path="/students/:id">
        <ProtectedRoute>
          <StudentDetail />
        </ProtectedRoute>
      </Route>

      {/* Admin-only route */}
      <Route path="/users">
        <ProtectedRoute requireAdmin>
          <UserManagement />
        </ProtectedRoute>
      </Route>

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
