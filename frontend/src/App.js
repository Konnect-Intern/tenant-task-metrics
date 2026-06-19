import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminTenantPage from "@/pages/AdminTenantPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App min-h-screen bg-background text-foreground antialiased">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AdminTenantPage />} />
          <Route path="/admin/ui/tenants/:tenantId" element={<AdminTenantPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;
