import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/lib/auth";
import BottomNav from "@/components/bottom-nav";
import agentImg from "@assets/MV5BNmNkNmUyNjYtY2VhYi00ZjE4LWI0NmMtNmJkZDc2NzEyMzgxXkEyXkFqcG_1777886048395.jpg";
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

function WheelSVG() {
  const colors = ["#EF4444","#3B82F6","#8B5CF6","#10B981","#F59E0B","#EC4899","#14B8A6","#F97316","#6366F1"];
  const n = colors.length;
  const r = 22;
  const cx = 26, cy = 26;
  const segments = colors.map((color, i) => {
    const startAngle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const endAngle   = ((i + 1) / n) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    return `M${cx},${cy} L${x1},${y1} A${r},${r} 0 0,1 ${x2},${y2} Z`;
  });
  return (
    <svg width="52" height="52" viewBox="0 0 52 52">
      <circle cx={cx} cy={cy} r={r+2} fill="#DAA520" />
      {segments.map((d, i) => <path key={i} d={d} fill={colors[i]} stroke="rgba(255,255,255,0.4)" strokeWidth="0.8" />)}
      <circle cx={cx} cy={cy} r={5} fill="white" stroke="#ccc" strokeWidth="1" />
      <text x={cx} y={cy+1} textAnchor="middle" dominantBaseline="middle" fontSize="5" fontWeight="bold" fill="#555">GO</text>
    </svg>
  );
}

function FloatingButtons() {
  const [location, navigate] = useLocation();
  const hideOn = ["/game", "/bank-card", "/deposit", "/withdraw", "/admin", "/service-client", "/telegram"];
  if (hideOn.some(p => location.startsWith(p))) return null;

  return (
    <div className="fixed right-3 bottom-24 z-40 flex flex-col gap-2">
      <button
        data-testid="float-btn-game"
        onClick={() => navigate("/game")}
        className="w-14 h-14 rounded-full overflow-hidden shadow-xl border-2 border-white"
        style={{ background: "linear-gradient(135deg, #1A1A2E, #16213E)" }}
      >
        <WheelSVG />
      </button>
      <button
        data-testid="float-btn-service"
        onClick={() => navigate("/service-client")}
        className="w-14 h-14 rounded-full overflow-hidden shadow-xl border-2 border-white"
      >
        <img src={agentImg} alt="Service client" className="w-full h-full object-cover object-top" />
      </button>
    </div>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-3xl overflow-hidden shadow-lg mb-1">
            <img src="/sinopec-logo.jpeg" alt="SINOPEC" className="w-full h-full object-cover" />
          </div>
          <p className="text-amber-500 font-bold text-lg tracking-wide">SINOPEC</p>
          <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;
  if (!user.transactionPassword) return <TradePasswordPage />;

  return (
    <div className="min-h-screen bg-gray-50">
      <div key={location}>
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
