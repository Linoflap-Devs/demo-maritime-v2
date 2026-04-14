import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { CrewPayrollHistoryItem } from "@/src/services/payroll/crewPayrollHistory.api";

interface CrewDeductionDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  crewPayroll: CrewPayrollHistoryItem | null;
}

interface DeductionDistribution {
  name: string;
  currency: string;
  forex: number;
  amount: string;
  dollar: string;
}

export function CrewDeductionDistribution({
  open,
  onOpenChange,
  crewPayroll,
}: CrewDeductionDistributionDialogProps) {

  const columns: ColumnDef<DeductionDistribution>[] = [
    {
      accessorKey: "name",
      header: "Deduction",
    },
    {
      accessorKey: "currency",
      header: "Currency",
    },
    {
      accessorKey: "forex",
      header: "Exchange Rate",
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
          <DialogTitle className="text-center text-2xl font-semibold text-primary">Deduction Distribution</DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <DataTable 
            columns={columns} 
            data={crewPayroll?.allotmentDeductions || []}
            pageSize={5} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
