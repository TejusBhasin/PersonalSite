import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Layout from './components/Layout';
import ProjectDetail from './pages/ProjectDetail';
import PhotoAlbum from './pages/PhotoAlbum';
import Games from './pages/Games';
import PlayGame from './pages/PlayGame';
import Visits from './pages/Visits';
import VisitTracker from './components/VisitTracker';
import SiteGate from './components/SiteGate';
import ContentGuard from './components/ContentGuard';
// Add page imports here

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
    <VisitTracker />
    <SiteGate>
    <ContentGuard />
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/photo-album" element={<PhotoAlbum />} />
        <Route path="/visits" element={<Visits />} />
        <Route path="/gamesthatonlytejushas" element={<Games />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        {/* Add your page Route elements here */}
      </Route>
      <Route path="/project/:slug" element={<ProjectDetail />} />
      <Route path="/gamesthatonlytejushas/:slug" element={<PlayGame />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
    </SiteGate>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App