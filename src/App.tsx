import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Studio } from "@/app/Studio";

export default function App() {
  return (
    <TooltipProvider>
      <Studio />
      <Toaster />
    </TooltipProvider>
  );
}
