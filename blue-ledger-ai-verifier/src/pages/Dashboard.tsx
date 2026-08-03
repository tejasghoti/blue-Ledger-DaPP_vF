import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/StatsCard";
import { ProjectsTable } from "@/components/ProjectsTable";
import { ProjectRegistrationModal } from "@/components/ProjectRegistrationModal";
import { Plus, TreePine, Award, Clock, BarChart3 } from "lucide-react";
import heroOcean from "@/assets/hero-ocean.jpg";
import { useReadContract, useReadContracts } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";

// ✅ Import CometCard here
import { CometCard } from "@/components/ui/CometCard"; 
import { MOCK_PROJECTS } from "@/lib/mockData";

// Define the TypeScript type to match your UPDATED Project struct in Solidity
// This interface MUST include all properties that StatsCard or other consuming
// components in this file might need, based on the contract's return type.
type Project = {
  id: bigint;
  name: string;
  location: string;
  metadataHash: string;
  owner: `0x${string}`;
  status: number;
  lastSubmittedAt: bigint;
  carbonSequestered: bigint;
  // If 'creditsMinted' or other fields are part of the Project struct in Solidity
  // and are directly returned by getAllProjects, they should be here too.
  // For now, based on previous context, `carbonSequestered` is what's used
  // in stats calculation and `creditsMinted` is calculated separately.
};

// Define the contract object for Wagmi
const blueLedgerContract = {
  address: contractAddress as `0x${string}`,
  abi: contractAbi,
};

export default function Dashboard() {
  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);

  // Fetch all projects data
  const { data: allProjects, isLoading: isLoadingProjects, refetch } = useReadContract({
    ...blueLedgerContract,
    functionName: "getAllProjects",
    query: { refetchInterval: 10000 },
  });

  // Calculate all stats in one place for efficiency
  const stats = useMemo(() => {
    const rawProjects = (allProjects as unknown as Project[]) ?? [];
    const projects = rawProjects.length > 0 ? rawProjects : (MOCK_PROJECTS as unknown as Project[]);

    const totalProjects = projects.length;
    const pendingVerification = projects.filter(p => p.status === 1).length;

    const carbonSequestered = projects.reduce((acc, p) => {
      return acc + (p.carbonSequestered || 0n);
    }, 0n); 

    return {
      totalProjects,
      pendingVerification,
      carbonSequestered, 
    };
  }, [allProjects]);
  
  // Logic for calculating "Credits Minted"
  const verifiedProjects = useMemo(() =>
    (Array.from(allProjects ?? []) as Project[]).filter(p => p.status === 2),
  [allProjects]);

  const { data: creditsData } = useReadContracts({
    contracts: verifiedProjects.map(p => ({
      ...blueLedgerContract,
      functionName: 'balanceOf',
      args: [p.owner, p.id],
    })),
    query: { enabled: verifiedProjects.length > 0 }
  });

  const totalCreditsMinted = useMemo(() => {
    if (!creditsData) return 0n;
    return creditsData
      .filter(d => d.status === 'success')
      .reduce((acc, current) => {
        const value = current.result;
        return acc + (typeof value === "bigint" ? value : 0n);
      }, 0n);
  }, [creditsData]);

  const isLoading = isLoadingProjects; // Combined loading state from project fetching

  const handleSuccess = () => {
    refetch(); // Refetch projects after a successful registration
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div 
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroOcean})` }}
      >
        <div className="absolute inset-0 bg-gradient-depth/70" />
        <div className="relative h-full flex items-center justify-between px-8">
          <div>
            <h1 className="text-4xl font-bold text-primary-foreground mb-2">
              Welcome back!
            </h1>
            <p className="text-lg text-primary-foreground/90">
              Track your blue carbon restoration projects and verified credits
            </p>
          </div>
          <Button
            onClick={() => setIsRegistrationOpen(true)}
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-ocean"
          >
            <Plus className="w-5 h-5 mr-2" />
            Register New Project
          </Button>
        </div>
      </div>

      <div className="p-8 -mt-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* ✅ Wrap each StatsCard with CometCard */}
          <CometCard className="transform-3d">
            <StatsCard
              title="Total Projects"
              value={isLoading ? "..." : stats.totalProjects.toString()}
              subtitle="Registered restoration sites"
              icon={TreePine}
            />
          </CometCard>

          <CometCard className="transform-3d">
            <StatsCard
              title="Carbon Sequestered"
              value={isLoading ? "..." : stats.carbonSequestered.toString()}
              subtitle="Verified tonnes CO₂"
              icon={BarChart3}
            />
          </CometCard>

          <CometCard className="transform-3d">
            <StatsCard
              title="Credits Minted"
              value={isLoading ? "..." : totalCreditsMinted.toString()}
              subtitle="Verified carbon credits"
              icon={Award}
            />
          </CometCard>

          <CometCard className="transform-3d">
            <StatsCard
              title="Pending Verification"
              value={isLoading ? "..." : stats.pendingVerification.toString()}
              subtitle="Projects awaiting review"
              icon={Clock}
            />
          </CometCard>
        </div>

        <ProjectsTable />
      </div>

      <ProjectRegistrationModal
        open={isRegistrationOpen}
        onOpenChange={setIsRegistrationOpen}
        onSuccess={handleSuccess}
      />
    </div>
  );
}