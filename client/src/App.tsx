import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import serviceClientImg from "@assets/Img_2026_03_22_11_16_53_1774178912559.jpeg";
import gameWheelImg from "@assets/20260322_111525_1774178920867.png";
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
import DepositReturnPage from "@/pages/deposit-return";
import WithdrawPage from "@/pages/withdraw";
import BankCardPage from "@/pages/bank-card";
import SettingsPage from "@/pages/settings";
import TelegramPage from "@/pages/telegram";
import OrdersPage from "@/pages/orders";
import TransactionsPage from "@/pages/transactions";
import TeamRevenuePage from "@/pages/team-revenue";
import TeamDetailsPage from "@/pages/team-details";
import BalancePage from "@/pages/balance";
import AboutPage from "@/pages/about";
import AdminPage from "@/pages/admin";
import TreasurePage from "@/pages/treasure";
import ServiceClientPage from "@/pages/service-client";
import NotFound from "@/pages/not-found";

function FloatingButtons() {
  const [location, navigate] = useLocation();
  const hideOn = ["/game", "/bank-card", "/deposit", "/withdraw", "/admin", "/service-client"];
  if (hideOn.some(p => location.startsWith(p))) return null;

  return (
    <div className="fixed right-3 bottom-24 z-40 flex flex-col gap-2">
      <button
        data-testid="float-btn-game"
        onClick={() => navigate("/game")}
        className="w-14 h-14 rounded-full overflow-hidden shadow-lg border-2 border-white animate-bounce-in"
        style={{ animationDelay: "0.1s" }}
      >
        <img src={gameWheelImg} alt="Jeu" className="w-full h-full object-cover" />
      </button>
      <button
        data-testid="float-btn-service"
        onClick={() => navigate("/service-client")}
        className="w-14 h-14 rounded-full overflow-hidden shadow-lg border-2 border-white animate-bounce-in"
        style={{ animationDelay: "0.22s" }}
      >
        <img src={serviceClientImg} alt="Service client" className="w-full h-full object-cover" />
      </button>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

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
    <div className="min-h-screen pb-24">
      <div key={location} className="animate-page-enter">
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
          <Route path="/deposit-return" component={DepositReturnPage} />
          <Route path="/withdraw" component={WithdrawPage} />
          <Route path="/bank-card" component={BankCardPage} />
          <Route path="/settings" component={SettingsPage} />
          <Route path="/trade-password" component={TradePasswordPage} />
          <Route path="/telegram" component={TelegramPage} />
          <Route path="/orders" component={OrdersPage} />
          <Route path="/transactions" component={TransactionsPage} />
          <Route path="/team-revenue" component={TeamRevenuePage} />
          <Route path="/team-details" component={TeamDetailsPage} />
          <Route path="/balance" component={BalancePage} />
          <Route path="/about" component={AboutPage} />
          <Route path="/admin" component={AdminPage} />
          <Route path="/treasure" component={TreasurePage} />
          <Route path="/service-client" component={ServiceClientPage} />
          <Route path="/inscription"><Redirect to="/" /></Route>
          <Route component={NotFound} />
        </Switch>
      </div>
      <FloatingButtons />
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
