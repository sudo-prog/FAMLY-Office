import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  createdAt: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", role: "member", pinHash: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setUsers(data))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const newUser = await res.json();
        setUsers([...users, newUser]);
        setForm({ email: "", name: "", role: "member", pinHash: "" });
        setShowForm(false);
      }
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      setUsers(users.filter((u) => u.id !== id));
    } catch {
      // silent
    }
  };

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-100 text-red-800",
      member: "bg-blue-100 text-blue-800",
      viewer: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[role] || colors.viewer}`}>
        {role}
      </span>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Family Members</h1>
            <p className="text-muted-foreground">Manage user access to your Family Office</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {showForm ? "Cancel" : "Add Member"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-lg border bg-card p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">PIN Hash (optional)</label>
                <input
                  type="text"
                  value={form.pinHash}
                  onChange={(e) => setForm({ ...form, pinHash: e.target.value })}
                  className="mt-1 block w-full rounded-md border px-3 py-2 text-sm"
                  placeholder="bcrypt hash"
                />
              </div>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Create User
            </button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : users.length === 0 ? (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">No family members yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Email</th>
                  <th className="px-4 py-3 text-left font-medium">Role</th>
                  <th className="px-4 py-3 text-left font-medium">Created</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{user.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-4 py-3">{roleBadge(user.role)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
