import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import CardDetail from "./pages/CardDetail";
import SetDetail from "./pages/SetDetail";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminListings from "./pages/admin/AdminListings";
import AdminReviewSeller from "./pages/admin/AdminReviewSeller";
import AdminLogs from "./pages/admin/AdminLogs";
import AdminBanners from "./pages/admin/AdminBanners";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import NotFound from "./pages/NotFound";
import Collections from "./pages/Collections";
import Marketplace from "./pages/Marketplace";
import Community from "./pages/Community";
import GuideDetail from "./pages/GuideDetail";
import Products from "./pages/Products";
import Accessories from "./pages/Accessories";
import CreateListing from "./pages/CreateListing";
import SellerDashboard from "./pages/SellerDashboard";
import MyProfile from "./pages/MyProfile";
import Notifications from "./pages/Notifications";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/colecoes" element={<Collections />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/acessorios" element={<Accessories />} />
            <Route path="/comunidade" element={<Community />} />
            <Route path="/guia/:slug" element={<GuideDetail />} />
            <Route path="/pokemon/cards/:cardId" element={<CardDetail />} />
            <Route path="/sets/:setId" element={<SetDetail />} />
            <Route path="/anunciar" element={<CreateListing />} />
            <Route path="/meus-anuncios" element={<SellerDashboard />} />
            <Route path="/meu-perfil" element={<MyProfile />} />
            <Route path="/perfil" element={<MyProfile />} />
            <Route path="/notificacoes" element={<Notifications />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Admin routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="banners" element={<AdminBanners />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="listings" element={<AdminListings />} />
              <Route path="listings/review/:sellerId" element={<AdminReviewSeller />} />
              <Route path="logs" element={<AdminLogs />} />
              <Route path="analytics" element={<AdminAnalytics />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
