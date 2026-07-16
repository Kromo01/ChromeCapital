import React from "react";
import PageLayout from "../components/PageLayout.jsx";
import CompoundInterestCalculator from "../calculators/CompoundInterestCalculator.jsx";

export default function Invest() {
  return (
    <PageLayout>
      <div className="py-10 md:py-14">
        <CompoundInterestCalculator />
      </div>
    </PageLayout>
  );
}
