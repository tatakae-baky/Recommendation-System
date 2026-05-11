import { useState } from "react";
import Layout from "./components/Layout.jsx";
import DemoWalkthrough from "./pages/DemoWalkthrough.jsx";
import HomeFeed from "./pages/HomeFeed.jsx";
import ItemPage from "./pages/ItemPage.jsx";
import ModelComparison from "./pages/ModelComparison.jsx";
import UserPage from "./pages/UserPage.jsx";

export default function App() {
  const [activePage, setActivePage] = useState("demo");
  const [selectedArticleId, setSelectedArticleId] = useState("");

  function handleItemSelect(articleId) {
    setSelectedArticleId(articleId);
    setActivePage("item");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Layout activePage={activePage} onNavigate={setActivePage}>
      {activePage === "demo" && <DemoWalkthrough onOpenExplorer={setActivePage} />}
      {activePage === "home" && <HomeFeed onItemSelect={handleItemSelect} />}
      {activePage === "item" && <ItemPage onItemSelect={handleItemSelect} selectedArticleId={selectedArticleId} />}
      {activePage === "user" && <UserPage />}
      {activePage === "metrics" && <ModelComparison />}
    </Layout>
  );
}
