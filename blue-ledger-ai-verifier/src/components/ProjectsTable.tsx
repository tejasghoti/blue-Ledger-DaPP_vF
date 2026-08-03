import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MapPin, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom"; // --- 1. Import useNavigate ---

// --- WEB3 IMPORTS ---
import { useReadContract } from "wagmi";
import { blueLedgerAddress } from "@/contracts/contractAddress";
import BlueLedgerAbi from "@/contracts/BlueLedger.json";
import { MOCK_PROJECTS } from "@/lib/mockData";

// --- TypeScript Interfaces ---
interface Project {
  id: bigint;
  name: string;
  location: string;
  metadataHash: string;
  owner: `0x${string}`;
  status: number;
  lastSubmittedAt: bigint;
}

// --- Helper Data ---
const statusEnum = ["PENDING", "AWAITING_VERIFICATION", "VERIFIED", "REJECTED"] as const;
const statusStyles: Record<typeof statusEnum[number], string> = {
  PENDING: "bg-accent text-accent-foreground",
  AWAITING_VERIFICATION: "bg-warning text-warning-foreground",
  VERIFIED: "bg-success text-success-foreground",
  REJECTED: "bg-destructive text-destructive-foreground",
};
const statusLabels: Record<typeof statusEnum[number], string> = {
  PENDING: "Pending",
  AWAITING_VERIFICATION: "Awaiting Review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

// --- Component Definition ---
export function ProjectsTable() {
  const navigate = useNavigate();

  const { data: projectsData, isLoading } = useReadContract({
    address: blueLedgerAddress,
    abi: BlueLedgerAbi.abi,
    functionName: 'getAllProjects',
    query: { refetchInterval: 5000 },
  });

  const rawProjects: Project[] = (projectsData as Project[] || []).filter(p => p.id !== 0n);
  // Fallback to rich mock projects for seamless resume / demo visualization
  const projects = rawProjects.length > 0 ? rawProjects : MOCK_PROJECTS;

  // --- 4. Create the navigation handler ---
  const handleViewProject = (projectId: string) => {
    navigate(`/project/${projectId}`);
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-foreground">
          On-Chain Restoration Projects
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Project ID</TableHead>
                <TableHead className="font-semibold">Project Name</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Loader2 className="h-5 w-5 animate-spin text-primary" /></TableCell></TableRow>
              )}
              {isError && (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-destructive">Error fetching data.</TableCell></TableRow>
              )}
              {isProjectDataEmpty && (
                <TableRow><TableCell colSpan={5} className="h-24 text-center"><Info className="inline-block mr-2" />No projects registered.</TableCell></TableRow>
              )}
              {projects.map((project) => {
                const statusKey = project.status < statusEnum.length ? statusEnum[project.status] : "PENDING";
                return (
                  <TableRow key={project.id.toString()} className="hover:bg-muted/30">
                    <TableCell className="font-mono">{project.id.toString()}</TableCell>
                    <TableCell><div className="font-medium text-foreground">{project.name}</div></TableCell>
                    <TableCell><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="text-sm">{project.location}</span></div></TableCell>
                    <TableCell><Badge className={cn("text-xs font-medium", statusStyles[statusKey])}>{statusLabels[statusKey]}</Badge></TableCell>
                    <TableCell className="text-center">
                      {/* --- 5. Update the onClick handler to call our new function --- */}
                      <Button variant="outline" size="sm" onClick={() => handleViewProject(project.id.toString())} className="gap-2">
                        <Eye className="h-4 w-4" /> View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

