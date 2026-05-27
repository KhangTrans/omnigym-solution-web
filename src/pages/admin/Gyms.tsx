import {Link} from "react-router-dom";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Building2, ExternalLink, Layers, MapPin, Store } from "lucide-react";
import { useBrands, useGyms } from "../../lib/gym-store";

function AdminGymsPage() {
  const { brands } = useBrands();
  const { gyms } = useGyms();
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    if (!term) return brands;
    return brands.filter(
      (b) =>
        b.name.toLowerCase().includes(term) ||
        b.ownerEmail.toLowerCase().includes(term),
    );
  }, [brands, q]);

  const totalBranches = gyms.length;
  const totalFacilities = gyms.reduce((s, g) => s + g.facilities.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Phòng tập</h1>
          <p className="text-sm text-muted-foreground">
            {brands.length} brands · {totalBranches} branches · {totalFacilities} facilities
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Brands</span>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold">{brands.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Multi-branch</span>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold">
              {brands.filter((b) => b.type === "system").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">Standalone</span>
              <Store className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold">
              {brands.filter((b) => b.type === "standalone").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Tất cả brands</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Tìm theo tên hoặc email chủ sở hữu…" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Owner email</TableHead>
                  <TableHead className="text-right">Branches</TableHead>
                  <TableHead className="w-32 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((b) => {
                  const branches = gyms.filter((g) => g.brandId === b.id);
                  return (
                    <TableRow key={b.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <img src={b.logo} alt={b.name} className="h-9 w-9 rounded object-cover border border-border" />
                          <div>
                            <div className="font-medium">{b.name}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">{b.tagline}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={b.type === "system" ? "default" : "secondary"}>{b.type}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">{b.ownerEmail}</TableCell>
                      <TableCell className="text-right tabular-nums">{branches.length}</TableCell>
                      <TableCell className="text-right">
                        {branches[0] ? (
                          <Button asChild size="sm" variant="ghost">
                            <Link to={`/gym/${branches[0].id}`}>
                              View <ExternalLink className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Tất cả branches</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {gyms.map((g) => {
              const brand = brands.find((b) => b.id === g.brandId);
              return (
                <div key={g.id} className="overflow-hidden rounded-lg border bg-card">
                  <div className="aspect-[16/9] bg-muted">
                    <img src={g.image} alt={g.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold text-sm truncate">{g.name}</div>
                      <Badge variant="outline" className="shrink-0 text-[10px]">★ {g.rating.toFixed(1)}</Badge>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {g.city}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {brand?.name} · {g.facilities.length} facilities · {g.trainerIds.length} trainers
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminGymsPage;
