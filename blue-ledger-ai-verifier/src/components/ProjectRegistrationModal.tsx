import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, MapPin, Loader2, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import axios from "axios";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { contractAddress, contractAbi } from "@/contracts/contractConfig";
import { encodeAbiParameters, TransactionReceipt } from 'viem';
import { FileUpload } from "@/components/ui/file-upload"; // ✅ 1. Import the new component

// --- Interface Definitions (from previous context) ---
interface ProjectRegistrationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
type RegistrationStep = "details" | "upload";

export function ProjectRegistrationModal({ open, onOpenChange, onSuccess }: ProjectRegistrationModalProps) {
  const [currentStep, setCurrentStep] = useState<RegistrationStep>("details");
  const [formData, setFormData] = useState({ name: "", description: "", location: "", lat: "", lng: "" });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { address: userAddress, isConnected, isConnecting } = useAccount();

  const { data: isNgo, isLoading: isLoadingNgoStatus } = useReadContract({
    address: contractAddress,
    abi: contractAbi,
    functionName: 'isNgo',
    args: [userAddress!],
    query: { enabled: isConnected && !!userAddress },
  });

  const { data: hash, writeContract, isPending, error, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash });

  const handleSubmit = async () => {
    if (!isStepValid()) return;
    setIsUploading(true);
    const toastId = `reg-${Date.now()}`;
    toast.loading("Uploading files to IPFS...", { id: toastId });
    try {
      const pinataUrl = "https://api.pinata.cloud/pinning/pinFileToIPFS";
      const imageFormData = new FormData();
      imageFormData.append("file", uploadedFiles[0]);
      
      const imageRes = await axios.post(pinataUrl, imageFormData, {
        headers: {
          'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY,
          'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_API_KEY,
        },
      });
      const imageIpfsHash = imageRes.data.IpfsHash;

      const metadata = { name: formData.name, description: formData.description, image: imageIpfsHash, coordinates: { lat: parseFloat(formData.lat), lng: parseFloat(formData.lng) } };
      const metadataBlob = new Blob([JSON.stringify(metadata)], { type: "application/json" });
      const metadataFile = new File([metadataBlob], "metadata.json");
      const metadataFormData = new FormData();
      metadataFormData.append("file", metadataFile);
      
      const metadataRes = await axios.post(pinataUrl, metadataFormData, {
         headers: {
          'pinata_api_key': import.meta.env.VITE_PINATA_API_KEY,
          'pinata_secret_api_key': import.meta.env.VITE_PINATA_SECRET_API_KEY,
        },
      });
      const metadataIpfsHash = metadataRes.data.IpfsHash;
      
      toast.loading("Awaiting wallet confirmation...", { id: toastId });
      writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: "registerProject",
        args: [formData.name, formData.location, metadataIpfsHash],
      });
    } catch (err) {
      console.error("Project Registration Error:", err);
      toast.error("Project Registration Failed", { id: toastId, description: "Could not upload files to IPFS." });
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      toast.success("Project Registered Successfully!");
      onSuccess?.();
      setFormData({ name: "", description: "", location: "", lat: "", lng: "" });
      setUploadedFiles([]);
      setCurrentStep("details");
      onOpenChange(false);
      reset();
    }
    if (error) {
       toast.error("Transaction Failed", { description: error.message });
       reset();
    }
  }, [isConfirmed, error, onOpenChange, onSuccess, reset]);

  const handleNext = () => currentStep === "details" && setCurrentStep("upload");
  const handleBack = () => currentStep === "upload" && setCurrentStep("details");
  
  // ✅ 2. Update the file handler to accept an array of files
  const handleFileUpload = (newFiles: File[]) => {
    setUploadedFiles(newFiles);
  };

  const isStepValid = () => {
    if (currentStep === "details") return formData.name && formData.description && formData.location && formData.lat && formData.lng;
    if (currentStep === "upload") return uploadedFiles.length > 0;
    return false;
  };
  const isProcessing = isUploading || isPending || isConfirming;

  const renderContent = () => {
    if (isLoadingNgoStatus && isConnecting) {
      return <div className="flex justify-center items-center h-48"><Loader2 className="h-6 w-6 animate-spin" /></div>;
    }
    
    return (
      <>
        <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 px-3 py-2 rounded-lg text-xs flex items-center justify-between mt-2">
          <span>✨ Demo Mode: Full NGO & Admin Registration Rights Unlocked</span>
          <span className="font-mono text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-200">ACTIVE</span>
        </div>

        <div className="flex items-center gap-4 my-6">
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium", currentStep === "details" ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground")}>1</div>
          <div className="text-sm font-medium">Project Details</div>
          <div className="flex-1 h-px bg-border" />
          <div className={cn("flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium", currentStep === "upload" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>2</div>
          <div className="text-sm font-medium">Initial Data</div>
        </div>
        
        {currentStep === "details" && ( <div className="space-y-6"> <Card><CardContent className="space-y-4 pt-6"> <div><Label htmlFor="project-name">Project Name *</Label><Input id="project-name" placeholder="e.g., Sundarbans Mangrove Restoration" value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} /></div> <div><Label htmlFor="project-description">Description *</Label><Textarea id="project-description" placeholder="Describe your project goals..." value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} className="min-h-[100px]" /></div> <div><Label htmlFor="project-location">Location *</Label><div className="relative"><MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input id="project-location" placeholder="e.g., West Bengal, India" value={formData.location} onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))} className="pl-10" /></div></div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <Label htmlFor="project-lat">Latitude *</Label>
                <Input id="project-lat" type="number" placeholder="e.g., 21.9497" value={formData.lat} onChange={(e) => setFormData(p => ({ ...p, lat: e.target.value }))} />
            </div>
            <div>
                <Label htmlFor="project-lng">Longitude *</Label>
                <Input id="project-lng" type="number" placeholder="e.g., 89.1833" value={formData.lng} onChange={(e) => setFormData(p => ({ ...p, lng: e.target.value }))} />
            </div>
        </div>
        </CardContent></Card> </div> )}

        {/* ✅ 3. Replace the upload step's content */}
        {currentStep === "upload" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upload Initial Data</CardTitle>
                <CardDescription>Provide documents and imagery for project verification.</CardDescription>
              </CardHeader>
              <CardContent>
                <FileUpload onChange={handleFileUpload} />
              </CardContent>
            </Card>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-6 border-t mt-4">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === "details" || isProcessing}><ChevronLeft className="w-4 h-4 mr-2" />Back</Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            {currentStep === "details" ? ( <Button onClick={handleNext} disabled={!isStepValid()} >Next Step<ChevronRight className="w-4 h-4 ml-2" /></Button> ) : ( <Button onClick={handleSubmit} disabled={!isStepValid() || isProcessing} className="bg-success text-success-foreground hover:bg-success/90"> {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</> : "Submit Project"} </Button> )}
          </div>
        </div>
      </>
    );
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold">Register New Project</DialogTitle>
          <DialogDescription>Submit your blue carbon restoration project for on-chain verification.</DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}