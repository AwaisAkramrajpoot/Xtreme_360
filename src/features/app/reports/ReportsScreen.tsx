import { AppAppBar } from "@/components/ui/AppAppBar";
import { ExpansionSelectionTile } from "@/components/ui/ExpansionSelectionTile";
import { reportGroups } from "@/constants/menu-data";

export function ReportsScreen() {
  return (
    <div className="min-h-full bg-white flex flex-col">
      <AppAppBar title="Reports" showSearch />
      <div className="flex-1 overflow-auto px-4 py-2">
        {reportGroups.map((group) => (
          <div
            key={group.title}
            className="mb-4 p-3 bg-white rounded-xl"
            style={{ boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}
          >
            <ExpansionSelectionTile title={group.title} items={group.options} />
          </div>
        ))}
      </div>
    </div>
  );
}
