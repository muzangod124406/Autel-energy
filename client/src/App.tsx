import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import AuthPage from "@/pages/auth";
import TradePasswordPage from "@/pages/trade-password";
import HomePage from "@/pages/home";
import InvestPage from "@/pages/invest";
import InvitePage from "@/pages/invite";
import BilletPage from "@/pages/billet";
import PostBlogPage from "@/pages/post-blog";
import AccountPage from "@/pages/account";
import GamePage from "@/pages/game";
import DepositPage from "@/pages/deposit";
import DepositHistoryPage from "@/pages/deposit-history";
import WithdrawPage from "@/pages/withdraw";
import BankCardPage from "@/pages/bank-card";
import SettingsPage from "@/pages/settings";
import TelegramPage from "@/pages/telegram";
import OrdersPage from "@/pages/orders";
import TransactionsPage from "@/pages/transactions";
import BalancePage from "@/pages/balance";
import AboutPage from "@/pages/about";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  if (!user.transactionPassword) {
    return <TradePasswordPage />;
  }

  return (
    <div className="min-h-screen pb-20">
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/invest" component={InvestPage} />
        <Route path="/invite" component={InvitePage} />
        <Route path="/billet" component={BilletPage} />
        <Route path="/post-blog" component={PostBlogPage} />
        <Route path="/account" component={AccountPage} />
        <Route path="/game" component={GamePage} />
        <Route path="/deposit" component={DepositPage} />
        <Route path="/deposit-history" component={DepositHistoryPage} />
        <Route path="/withdraw" component={WithdrawPage} />
        <Route path="/bank-card" component={BankCardPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/telegram" component={TelegramPage} />
        <Route path="/orders" component={OrdersPage} />
        <Route path="/transactions" component={TransactionsPage} />
        <Route path="/balance" component={BalancePage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/admin" component={AdminPage} />
        <Route component={NotFound} />
      </Switch>
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
