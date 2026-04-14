import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Deductions } from "@/src/services/payroll/payroll.api";

interface DeductionDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deductions: Deductions[];
  crewName: string;
}

export function DeductionDistributionDialog({
  open,
  onOpenChange,
  deductions,
  crewName,
}: DeductionDistributionDialogProps) {
  // Format numbers to two decimal places with null checking
  const formatNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "0.00";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2);
  };

  const columns: ColumnDef<Deductions>[] = [
    {
      accessorKey: "Name",
      header: "Deduction Name",
    },
    {
      accessorKey: "Currency",
      header: "Currency",
      cell: ({ row }) => (
        <div className="">
          {row.getValue<number>("Currency") === 1 ? "USD" : "PHP"}
        </div>
      ),
    },

    {
      accessorKey: "ExchangeRate",
      header: "Exchange Rate",
      cell: ({ row }) => (
        <div>{formatNumber(row.getValue("ExchangeRate"))}</div>
      ),
    },
    {
      accessorKey: "Amount",
      header: "Amount",
      cell: ({ row }) => (
        <div className="">{formatNumber(row.getValue("Amount"))}</div>
      ),
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-[#FCFCFC]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Deduction Distribution - {crewName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <DataTable columns={columns} data={deductions} pageSize={5} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
