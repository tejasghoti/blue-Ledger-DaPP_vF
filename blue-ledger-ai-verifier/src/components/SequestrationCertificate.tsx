import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, ShieldCheck, Download, ExternalLink, Leaf, CheckCircle2 } from 'lucide-react';

interface CertificateProps {
  certificateId: string;
  beneficiaryName: string;
  projectName: string;
  projectId: number | string;
  amountRetired: number;
  txHash: string;
  retiredAt: string;
  onClose?: () => void;
}

export const SequestrationCertificate: React.FC<CertificateProps> = ({
  certificateId,
  beneficiaryName,
  projectName,
  projectId,
  amountRetired,
  txHash,
  retiredAt,
  onClose,
}) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <Card id="printable-certificate" className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-background to-teal-950/20 shadow-2xl relative overflow-hidden p-6">
        {/* Subtle background seal effect */}
        <div className="absolute -right-16 -bottom-16 opacity-5 pointer-events-none">
          <Leaf className="w-96 h-96 text-emerald-500" />
        </div>

        <CardHeader className="text-center border-b border-emerald-500/20 pb-6">
          <div className="flex justify-center items-center gap-2 mb-2 text-emerald-500">
            <ShieldCheck className="w-8 h-8" />
            <span className="font-mono text-sm tracking-widest uppercase">Blue Ledger Protocol • Verified ESG Offset</span>
          </div>
          <CardTitle className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Certificate of Carbon Sequestration
          </CardTitle>
          <p className="text-xs font-mono text-muted-foreground mt-1">
            Cert ID: <span className="text-emerald-400">{certificateId}</span>
          </p>
        </CardHeader>

        <CardContent className="pt-6 space-y-6 text-center">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">This official document certifies that</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{beneficiaryName}</h3>
          </div>

          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-4 max-w-md mx-auto">
            <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold mb-1">Permanently Retired & Offset</p>
            <div className="text-4xl font-extrabold text-white flex items-center justify-center gap-2">
              <span>{amountRetired}</span>
              <span className="text-lg text-emerald-400 font-normal">tCO₂e</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Verified Blue Carbon Credits (ERC-1155)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-lg mx-auto bg-muted/30 p-4 rounded-lg border text-sm">
            <div>
              <span className="text-xs text-muted-foreground block">Mangrove Ecosystem Project</span>
              <span className="font-semibold text-foreground">{projectName} (ID: #{projectId})</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Date of Retirement</span>
              <span className="font-semibold text-foreground">{retiredAt}</span>
            </div>
          </div>

          <div className="border-t border-emerald-500/20 pt-4 text-xs font-mono text-muted-foreground space-y-2">
            <div className="flex items-center justify-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Immutable On-Chain Verification Proof</span>
            </div>
            <p className="break-all text-[11px]">
              Tx Hash: <a href={`https://amoy.polygonscan.com/tx/${txHash}`} target="_blank" rel="noreferrer" className="underline hover:text-emerald-300 inline-flex items-center gap-1">{txHash.slice(0, 24)}... <ExternalLink className="w-3 h-3" /></a>
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3 print:hidden">
        {onClose && <Button variant="outline" onClick={onClose}>Close</Button>}
        <Button onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2">
          <Download className="w-4 h-4" /> Print / Save Certificate PDF
        </Button>
      </div>
    </div>
  );
};
