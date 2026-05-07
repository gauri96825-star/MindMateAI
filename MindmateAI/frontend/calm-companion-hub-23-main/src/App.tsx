import { Routes, Route } from "react-router-dom";
import { Header } from "@/components/Header";
import HomePage from "@/routes/index";
import ChatPage from "@/routes/chat";
import BreathePage from "@/routes/breathe";
import JournalPage from "@/routes/journal";
import WellnessPage from "@/routes/wellness";
import LoginPage from "@/routes/login";

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/breathe" element={<BreathePage />} />
        <Route path="/journal" element={<JournalPage />} />
        <Route path="/wellness" element={<WellnessPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </>
  );
}
