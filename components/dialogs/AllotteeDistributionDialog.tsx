import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { Allottee } from "@/src/services/payroll/payroll.api";

interface AllotteeDistributionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allottees: Allottee[];
  crewName: string;
}

export function AllotteeDistributionDialog({
  open,
  onOpenChange,
  allottees,
  crewName,
}: AllotteeDistributionDialogProps) {
  // Format numbers to two decimal places with null checking
  const formatNumber = (value: string | number | null | undefined) => {
    if (value === null || value === undefined) return "0.00";
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    return isNaN(numValue) ? "0.00" : numValue.toFixed(2);
  };

  const columns: ColumnDef<Allottee>[] = [
    {
      accessorKey: "AllotteeName",
      header: "Allottee Name",
    },
    {
      accessorKey: "AccountNumber",
      header: "Account Number",
    },
    {
      accessorKey: "Bank",
      header: "Bank",
    },
    {
      accessorKey: "NetAllotment",
      header: "Net Allotment",
      cell: ({ row }) => (
        <div className="text-right">
          {formatNumber(row.getValue("NetAllotment"))}
        </div>
      ),
    },
    // {
    //   accessorKey: "Currency",
    //   header: "Currency",
    //   cell: ({ row }) => (
    //     <div className="text-right">
    //       {row.getValue<number>("Currency") === 1 ? "USD" : "PHP"}
    //     </div>
    //   ),
    // },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-[#FCFCFC]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            Allottee Distribution - {crewName}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-6">
          <DataTable columns={columns} data={allottees} pageSize={5} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
