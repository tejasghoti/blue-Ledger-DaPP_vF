import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { contractAddress, contractAbi } from '@/contracts/contractConfig';
import { SequestrationCertificate } from './SequestrationCertificate';
import { Flame, Loader2, Award } from 'lucide-react';
import { toast } from 'sonner';

interface RetireCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  projectName: string;
  userBalance: number;
}

export const RetireCreditsModal: React.FC<RetireCreditsModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectName,
  userBalance,
}) => {
  const [amount, setAmount] = useState<string>('1');
  const [beneficiary, setBeneficiary] = useState<string>('');
  const [memo, setMemo] = useState<string>('Scope 3 Carbon Neutrality Offset');
  const [retiredCertData, setRetiredCertData] = useState<any>(null);

  const { data: hash, isPending, writeContract } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const handleRetire = async () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Please enter a valid number of credits to retire.');
      return;
    }
    if (numAmount > userBalance) {
      toast.error('Retire amount exceeds your available credit balance.');
      return;
    }

    try {
      writeContract({
        address: contractAddress,
        abi: contractAbi,
        functionName: 'retireCredits',
        args: [BigInt(projectId), BigInt(numAmount), `${beneficiary || 'Anonymous'}: ${memo}`],
      });
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit retirement transaction.');
    }
  };

  React.useEffect(() => {
    if (isConfirmed && hash) {
      toast.success(`Successfully retired ${amount} Carbon Credits!`);
      setRetiredCertData({
        certificateId: `BLC-CERT-${Math.floor(100000 + Math.random() * 900000)}`,
        beneficiaryName: beneficiary || 'Valued ESG Sponsor',
        projectName,
        projectId,
        amountRetired: parseInt(amount, 10),
        txHash: hash,
        retiredAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      });
    }
  }, [isConfirmed, hash]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold text-emerald-400">
            <Flame className="w-5 h-5 text-amber-500" />
            Retire Carbon Credits (Burn-to-Offset)
          </DialogTitle>
          <DialogDescription>
            Permanently burn your tokenized carbon credits on-chain to offset emissions and generate a verifiable ESG certificate.
          </DialogDescription>
        </DialogHeader>

        {retiredCertData ? (
          <SequestrationCertificate
            {...retiredCertData}
            onClose={() => {
              setRetiredCertData(null);
              onClose();
            }}
          />
        ) : (
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center text-sm border">
              <span className="text-muted-foreground">Available Token Balance:</span>
              <span className="font-bold text-emerald-400 font-mono">{userBalance} BLC Credits (tCO₂)</span>
            </div>

            <div>
              <Label className="text-sm font-semibold">Credits to Permanently Burn (tCO₂e)</Label>
              <Input
                type="number"
                min="1"
                max={userBalance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="mt-1 font-mono"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Beneficiary Name (Entity / Person)</Label>
              <Input
                type="text"
                placeholder="e.g. Acme Corp / Tejas Ghoti"
                value={beneficiary}
                onChange={(e) => setBeneficiary(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="text-sm font-semibold">Offset Reason / Memo</Label>
              <Input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              onClick={handleRetire}
              disabled={isPending || isConfirming}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold gap-2 py-5"
            >
              {isPending || isConfirming ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isPending ? 'Confirm in Wallet...' : 'Confirming on Blockchain...'}
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-amber-300" />
                  Confirm Retirement & Mint Certificate
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
