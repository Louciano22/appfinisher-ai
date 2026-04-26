import { PlaceholderPage } from "@/components/placeholder-page";
import { routeContent } from "@/lib/mock-data";

export default function ProjectsPage() {
  return (
    <PlaceholderPage
      title={routeContent["/projects"].title}
      subtitle={routeContent["/projects"].subtitle}
      kind="projects"
    />
  );
}
