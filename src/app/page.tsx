import { getBriefing, getAvailableDates } from "@/lib/data";
import { BriefingView } from "@/components/BriefingView";

export const revalidate = 3600;

type PageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = await searchParams;
  const briefing = getBriefing(params.date);
  const availableDates = getAvailableDates();

  if (!briefing) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-gray-secondary">No briefing available yet.</p>
      </main>
    );
  }

  return <BriefingView briefing={briefing} availableDates={availableDates} />;
}
