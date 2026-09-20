import { Container } from "@/components/site/Container";
import { YourPriceWidget } from "@/components/site/YourPriceWidget";

export const metadata = {
  title: "Your Price Widget Preview | Masaar Holidays",
  robots: { index: false },
};

export default function PricingWidgetPreviewPage() {
  return (
    <div className="py-16 bg-[#FAF7F2] min-h-screen flex items-center justify-center">
      <Container>
        <YourPriceWidget
          doublePrice={799}
          triplePrice={699}
          quadPrice={599}
          packageSlug="essential-umrah"
        />
      </Container>
    </div>
  );
}
