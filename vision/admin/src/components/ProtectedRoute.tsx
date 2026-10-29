import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
}) => {
  const { isAuthenticated, isLoading, user, session } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-muted-foreground">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnTo = encodeURIComponent(window.location.href);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive">
            {session
              ? "このテナントの管理者ではありません"
              : "Cognito のログイン情報で管理画面を開けませんでした"}
          </p>
          <p className="mt-4 flex justify-center gap-4 text-sm">
            <a href="/">投稿画面</a>
            <a href={`/session?switch=1&return=${returnTo}`}>切り替える</a>
            <a href="/logout">ログアウト</a>
          </p>
        </div>
      </div>
    );
  }

  if (requireAdmin && user?.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-destructive">
          この機能にアクセスするには管理者権限が必要です
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
