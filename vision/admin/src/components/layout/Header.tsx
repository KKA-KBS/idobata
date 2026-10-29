import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Header: React.FC = () => {
  const { session } = useAuth();
  const returnTo = encodeURIComponent(window.location.href);

  return (
    <header className="bg-background shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
        <h1 className="text-xl font-bold text-foreground">
          <Link to="/">いどばた管理</Link>
        </h1>
        <div className="flex items-center gap-4 text-sm">
          {session?.displayName ? <span>{session.displayName}</span> : null}
          <a href="/">投稿画面</a>
          {session && session.count > 1 ? (
            <a href={`/session?switch=1&return=${returnTo}`}>切り替える</a>
          ) : null}
          <a href="/logout">ログアウト</a>
        </div>
      </div>
    </header>
  );
};

export default Header;
