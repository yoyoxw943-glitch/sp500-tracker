import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DisclaimerBanner from './components/DisclaimerBanner';
import LivePage from './pages/LivePage';
import HistoryPage from './pages/HistoryPage';
import NewsPage from './pages/NewsPage';
import CalculatorPage from './pages/CalculatorPage';
import LearnPage from './pages/LearnPage';
import PortfolioPage from './pages/PortfolioPage';

export default function App() {
  return (
    <>
      <DisclaimerBanner />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LivePage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="calculator" element={<CalculatorPage />} />
          <Route path="learn" element={<LearnPage />} />
          <Route path="portfolio" element={<PortfolioPage />} />
        </Route>
      </Routes>
    </>
  );
}
