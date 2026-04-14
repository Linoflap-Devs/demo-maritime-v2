import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { CrewPayrollHistoryItem } from "@/src/services/payroll/crewPayrollHistory.api";

interface CrewAllotteeDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewPayroll: CrewPayrollHistoryItem | null;
}

interface AllotteeDistribution {
  name: string;
  accountNumber: string;
  bank: string;
  amount: number;
  currency: number;
}

export function CrewAllotteeDistribution({
  open,
  onOpenChange,
  crewPayroll,
}: CrewAllotteeDistributionDialogProps) {

  const columns: ColumnDef<AllotteeDistribution>[] = [
    {
      accessorKey: "name",
      header: "Allottee Name",
    },
    {
      accessorKey: "accountNumber",
      header: "Account Number",
    },
    {
      accessorKey: "bank",
      header: "Bank",
    },
    {
      accessorKey: "amount",
      header: "Allotment",
      cell: ({ row }) => `₱ ${Number(row.original.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-[#FCFCFC]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">Allottee Distribution</DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <DataTable 
            columns={columns} 
            data={crewPayroll?.allotteeDistribution || []} 
            pageSize={5} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}