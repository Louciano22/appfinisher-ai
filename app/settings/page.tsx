import { PlaceholderPage } from "@/components/placeholder-page";
import { routeContent } from "@/lib/mock-data";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      title={routeContent["/settings"].title}
      subtitle={routeContent["/settings"].subtitle}
      kind="settings"
    />
  );
}
