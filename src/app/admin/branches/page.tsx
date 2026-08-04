import { BRANCHES } from "@/lib/admin-data";

export default function AdminBranchesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-semibold text-navy">
          Branches
        </h1>
        <button className="rounded-md bg-saffron-700 px-4 py-2 text-sm font-semibold text-white hover:bg-saffron-800">
          + Add New Branch
        </button>
      </div>

      <div className="rounded-xl border border-saffron-200 bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-saffron-50 text-navy/70">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Branch</th>
              <th className="text-left px-4 py-3 font-medium">Location</th>
              <th className="text-left px-4 py-3 font-medium">Manager</th>
              <th className="text-left px-4 py-3 font-medium">Members</th>
              <th className="text-left px-4 py-3 font-medium">
                Established
              </th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {BRANCHES.map((b) => (
              <tr key={b.id} className="border-t border-saffron-100">
                <td className="px-4 py-3 font-medium text-navy">{b.name}</td>
                <td className="px-4 py-3 text-navy/70">
                  {b.city}, {b.state}
                </td>
                <td className="px-4 py-3 text-navy/70">{b.managerName}</td>
                <td className="px-4 py-3 text-navy/70">
                  {b.memberCount.toLocaleString("en-IN")}
                </td>
                <td className="px-4 py-3 text-navy/70">
                  {b.establishedYear}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button className="text-xs font-medium text-saffron-700 hover:text-saffron-800">
                    Edit
                  </button>
                  <button className="text-xs font-medium text-red-600 hover:text-red-700">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
