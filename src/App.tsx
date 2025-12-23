import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";

import Settings from "./pages/Settings";
import ResourceManager from "./pages/ResourceManager";
import DocumentRenewal from "./pages/document/Renewal";
import SubscriptionRenewal from "./pages/subscription/Renewal";

// Document Pages
import AllDocuments from "./pages/document/AllDocuments";
import SharedDocuments from "./pages/document/Shared";

// Subscription Pages
import AllSubscriptions from "./pages/subscription/AllSubscriptions";
import SubscriptionApproval from "./pages/subscription/Approval";
import SubscriptionPayment from "./pages/subscription/Payment";

// Loan Pages
import AllLoans from "./pages/loan/AllLoans";
import LoanForeclosure from "./pages/loan/Foreclosure";
import LoanNOC from "./pages/loan/NOC";

import MasterPage from "./pages/master/MasterPage";

// Payment Pages
import PaymentRequestForm from "./pages/payment/RequestForm";
import PaymentApproval from "./pages/payment/PaymentApproval";
import MakePayment from "./pages/payment/MakePayment";
import TallyEntry from "./pages/payment/TallyEntry";

// Account FMS Pages
import AccountTallyData from "./pages/account/TallyData";
import AccountAudit from "./pages/account/Audit";
import AccountRectify from "./pages/account/Rectify";
import AccountBillFiled from "./pages/account/BillFiled";

// Main Router Configuration
function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          {/* Document Routes */}
          <Route path="document">
            <Route index element={<Navigate to="all" replace />} />
            <Route path="all" element={<AllDocuments />} />
            <Route path="renewal" element={<DocumentRenewal />} />
            <Route path="shared" element={<SharedDocuments />} />
          </Route>

          {/* Subscription Routes */}
          <Route path="subscription">
            <Route index element={<Navigate to="all" replace />} />
            <Route path="all" element={<AllSubscriptions />} />
            <Route path="approval" element={<SubscriptionApproval />} />
            <Route path="payment" element={<SubscriptionPayment />} />
            <Route path="renewal" element={<SubscriptionRenewal />} />
          </Route>

          {/* Loan Routes */}
          <Route path="loan">
            <Route index element={<Navigate to="all" replace />} />
            <Route path="all" element={<AllLoans />} />
            <Route path="foreclosure" element={<LoanForeclosure />} />
            <Route path="noc" element={<LoanNOC />} />
          </Route>

          <Route path="master" element={<MasterPage />} />
          <Route path="resource-manager" element={<ResourceManager />} />

          <Route path="settings" element={<Settings />} />

          {/* Payment Routes */}
          <Route path="payment">
            <Route index element={<Navigate to="request-form" replace />} />
            <Route path="request-form" element={<PaymentRequestForm />} />
            <Route path="approval" element={<PaymentApproval />} />
            <Route path="make-payment" element={<MakePayment />} />
            <Route path="tally-entry" element={<TallyEntry />} />
          </Route>

          {/* Account FMS Routes */}
          <Route path="account">
            <Route index element={<Navigate to="tally-data" replace />} />
            <Route path="tally-data" element={<AccountTallyData />} />
            <Route path="audit" element={<AccountAudit />} />
            <Route path="rectify" element={<AccountRectify />} />
            <Route path="bill-filed" element={<AccountBillFiled />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;