import React from "react";
import { Navigate, Route, BrowserRouter as Router, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Header from "./components/layout/Header";
import MainContent from "./components/layout/MainContent";
import Sidebar from "./components/layout/Sidebar";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import SiteConfigEdit from "./pages/SiteConfigEdit";
import ThemeClustering from "./pages/ThemeClustering";
import ThemeCreate from "./pages/ThemeCreate";
import ThemeEdit from "./pages/ThemeEdit";
import ThemeEmbedding from "./pages/ThemeEmbedding";
import ThemeList from "./pages/ThemeList";
import ThemeVectorSearch from "./pages/ThemeVectorSearch";

const baseUrl = import.meta.env.BASE_URL || "/";
const basename = baseUrl === "/" ? undefined : baseUrl.replace(/\/$/, "");

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router basename={basename}>
        <Routes>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex flex-col h-screen">
                  <Header />
                  <div className="flex flex-1 overflow-hidden">
                    <Sidebar />
                    <MainContent>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/themes" element={<ThemeList />} />
                        <Route path="/themes/new" element={<ThemeCreate />} />
                        <Route
                          path="/themes/:themeId"
                          element={<ThemeEdit />}
                        />
                        <Route
                          path="/themes/:themeId/embeddings"
                          element={<ThemeEmbedding />}
                        />
                        <Route
                          path="/themes/:themeId/vector-search"
                          element={<ThemeVectorSearch />}
                        />
                        <Route
                          path="/themes/:themeId/clustering"
                          element={<ThemeClustering />}
                        />
                        <Route
                          path="/siteConfig/edit"
                          element={<SiteConfigEdit />}
                        />
                      </Routes>
                    </MainContent>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
