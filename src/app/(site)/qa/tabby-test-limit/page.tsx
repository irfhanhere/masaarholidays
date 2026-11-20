import { Metadata } from "next";
import TabbyLimitTestClient from "./TabbyLimitTestClient";

export const metadata: Metadata = {
  title: "Tabby QA Sandbox Test - Masaar Holidays",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function TabbyTestLimitPage() {
  return <TabbyLimitTestClient />;
}
