import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, FileCheck, UserPlus, Loader2, Info, Lock, ExternalLink } from "lucide-react";
import { toast } from "sonner";

// --- WEB3 IMPORTS ---
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { isAddress } from "viem";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { MOCK_PROJECTS } from "@/lib/mockData";

interface Project {
  id: bigint; name: string; location: string; metadataHash: string; owner: `0x${string}`; status: number; lastSubmittedAt: bigint; carbonSequestered: bigint; creditsMinted: bigint; rejectionReason: string; registrationTimestamp: bigint; decisionTimestamp: bigint;
}

const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
const formatDate = (timestamp: bigint) => {
  if (timestamp === 0n) return "N/A";
  return new Date(Number(timestamp) * 1000).toLocaleDateString();
}

export default function AdminDashboard() {
  const [ngoAddress, setNgoAddress] = useState("");
  const { address: connectedAddress, isConnected } = useAccount();

  const { data: ownerAddress, isLoading: isLoadingOwner } = useReadContract({
    address: contractAddress, abi: contractAbi, functionName: 'owner',
  });

  const { data: projectsData } = useReadContract({
    address: contractAddress, abi: contractAbi, functionName: 'getAllProjects',
  });

  // In Demo Mode, unlock full admin access for testing
  const isAdmin = true;

  const rawProjects = (projectsData as unknown as Project[] || []).filter(p => p.status === 1);
  // Fallback to mock project awaiting verification if raw data is empty
  const projectsForReview = rawProjects.length > 0 ? rawProjects : (MOCK_PROJECTS.filter(p => p.status === 1) as unknown as Project[]);

  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const handleAddNgo = () => {
    if (!isAddress(ngoAddress)) {
      toast.error("Invalid wallet address provided.");
      return;
    }
    writeContract({
      address: contractAddress,
      abi: contractAbi,
      functionName: "addNgo",
      args: [ngoAddress],
    });
  };
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });
  useEffect(() => {
    if (isConfirming) toast.loading("Processing transaction on-chain...", { id: "ngo-tx" });
    if (isConfirmed) {
      toast.success("NGO Authorized Successfully!", { id: "ngo-tx" });
      setNgoAddress("");
    }
    if (error) toast.error("Transaction Failed", { id: "ngo-tx" });
  }, [isConfirming, isConfirmed, error]);

  if (isLoadingOwner) {
    return <div className="flex h-screen items-center justify-center gap-2 p-8"><Loader2 className="h-6 w-6 animate-spin" /><span className="text-lg font-medium">Verifying authorization...</span></div>;
  }

  if (!isAdmin) {
     return <div className="flex h-screen items-center justify-center p-8"><Card className="max-w-md text-center shadow-lg"><CardHeader><CardTitle className="flex items-center justify-center gap-2 text-destructive"><Lock className="h-6 w-6" /> Access Denied</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Only the contract administrator can access this dashboard.</p></CardContent></Card></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-surface p-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-gradient-ocean rounded-lg"><Shield className="h-6 w-6 text-primary-foreground" /></div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">NCCR Verification Dashboard</h1>
            <p className="text-muted-foreground">Review and verify blue carbon restoration projects.</p>
          </div>
        </div>
        
        <Card className="shadow-card">
          <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus /> Authorize New NGO</CardTitle></CardHeader>
          <CardContent className="flex items-end gap-4">
            <div className="flex-grow">
              <Label htmlFor="ngo-address">NGO Wallet Address</Label>
              <Input id="ngo-address" placeholder="0x..." value={ngoAddress} onChange={(e) => setNgoAddress(e.target.value)} disabled={isPending || isConfirming}/>
            </div>
            <Button onClick={handleAddNgo} disabled={isPending || isConfirming || !ngoAddress}>
              {(isPending || isConfirming) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Authorize NGO
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader><CardTitle className="flex items-center gap-2"><FileCheck /> Projects Awaiting Verification</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project ID</TableHead>
                  <TableHead>Submitted By</TableHead>
                  <TableHead>Date Submitted</TableHead>
                  <TableHead>Data Hash (IPFS)</TableHead>
                  <TableHead className="text-right">Carbon Est.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingProjects && <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="inline-block h-6 w-6 animate-spin" /></TableCell></TableRow>}
                {!isLoadingProjects && projectsForReview.length === 0 && <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground"><Info className="inline-block mr-2" />No projects are currently awaiting verification.</TableCell></TableRow>}
                
                {projectsForReview.map((project) => (
                  <TableRow key={project.id.toString()}>
                    <TableCell className="font-mono">{project.id.toString()}</TableCell>
                    <TableCell><code className="text-xs" title={project.owner}>{formatAddress(project.owner)}</code></TableCell>
                    <TableCell>{formatDate(project.lastSubmittedAt)}</TableCell>
                    <TableCell>
                      <a href={`https://gateway.pinata.cloud/ipfs/${project.metadataHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs hover:underline">
                        {formatAddress(project.metadataHash)} <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-right font-mono">{project.carbonSequestered.toString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-yellow-600 border-yellow-500">
                        Awaiting
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button asChild variant="default" size="sm">
                        <Link to={`/admin/verify/${project.id.toString()}`}>Review</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}