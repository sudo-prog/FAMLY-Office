import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Plus, Settings, Users } from 'lucide-react';

interface Office {
  id: number;
  name: string;
  domain: string;
  users: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

const mockOffices: Office[] = [
  { id: 1, name: 'Corporate HQ', domain: 'familyoffice.com', users: 5, status: 'active', createdAt: '2026-01-15' },
  { id: 2, name: 'Sydney Branch', domain: 'sydney.familyoffice.com', users: 3, status: 'active', createdAt: '2026-03-22' },
  { id: 3, name: 'Melbourne Advisors', domain: 'melb.familyoffice.com', users: 2, status: 'inactive', createdAt: '2026-05-10' },
];

export default function WhiteLabelPage() {
  const [offices] = useState<Office[]>(mockOffices);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Multi-Office Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage multiple family office instances under one roof</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Office
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Offices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offices.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{offices.filter(o => o.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{offices.reduce((sum, o) => sum + o.users, 0)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Office Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Office Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {offices.map((office) => (
                <TableRow key={office.id}>
                  <TableCell className="font-medium">{office.name}</TableCell>
                  <TableCell className="text-muted-foreground">{office.domain}</TableCell>
                  <TableCell>{office.users}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      office.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {office.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{office.createdAt}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            White-Label Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Default Theme</label>
              <Input defaultValue="Dark Gold" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Default Currency</label>
              <Input defaultValue="AUD" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Default Language</label>
              <Input defaultValue="en-AU" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Max Users Per Office</label>
              <Input defaultValue="10" type="number" className="mt-1" />
            </div>
          </div>
          <Button>Save Configuration</Button>
        </CardContent>
      </Card>
    </div>
  );
}
