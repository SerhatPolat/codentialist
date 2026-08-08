import { Suspense } from "react";
import Home from "@/components/Home";
import LoadingView from "@/components/LoadingView";

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingView />}>
      <Home />
    </Suspense>
  );
}
