import React from "react";
import PageLayout from "../components/PageLayout.jsx";
import BudgetDashboardTool from "../calculators/BudgetDashboardTool.jsx";

export default function BudgetDashboard() {
  return (
    <PageLayout>
      <div className="py-10 md:py-14">
        <BudgetDashboardTool />
      </div>
    </PageLayout>
  );
}
