import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { z } from "zod";
import { useEffect, useMemo, useRef, useState } from "react";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AllotteeUiModel } from "@/types/crewAllottee";
import { useEditAllotteeStore } from "@/src/store/useEditAllotteeStore";
import { IRelationship } from "@/src/services/relationship/relationship.api";
import { CitiesItem, ProvincesItem } from "@/src/services/location/location.api";

const editAllotteeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  relation: z.number().optional(),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  province: z.number().optional(),
  city: z.number().optional(),
  bank: z.number().optional(),
  branch: z.number().optional(),
  accountNumber: z.string().optional(),
});

type EditAllotteeFormData = z.infer<typeof editAllotteeSchema>;

interface EditUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  SelectedAllotteeData: AllotteeUiModel;
  onSuccess?: (updatedUser: AllotteeUiModel) => void;
  isEditingAllottee: boolean;
  isAddingAllottee: boolean | null;
  isEditModalStatus: Record<number, boolean>;
  setEditModalStatus: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  allRelationshipData: IRelationship[];
  cities: CitiesItem[];
  provinces: ProvincesItem[];
  uniqueBanks: any[];
  loading: boolean;
  fetchBanks: () => Promise<void>;
  getUniqueBanks: () => void;
  selectedBankId: number | string | null;
  setSelectedBankId: (bankId: number | null) => void;
  getBranchesByBankId: (
    bankId: number
  ) => { BankID: number; BankBranchID: number; BankBranchName: string }[];
}

export function EditAllotteeDialog({
  open,
  onOpenChange,
  SelectedAllotteeData,
  isEditingAllottee,
  isAddingAllottee,
  setEditModalStatus,
  provinces,
  cities,
  loading,
  selectedBankId,
  uniqueBanks,
  getBranchesByBankId,
  allRelationshipData,
  setSelectedBankId,
}: EditUserDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [editingAllottee, setEditingAllottee] = useState<AllotteeUiModel | null>(null);
  const [searchCity, setSearchCity] = useState("");
  const [searchProvince, setSearchProvince] = useState("");
  const [searchBranch, setSearchBranch] = useState("");

  const setDraft = useEditAllotteeStore((state) => state.setDraft);
  const drafts = useEditAllotteeStore((state) => state.drafts);

  const form = useForm<EditAllotteeFormData>({
    resolver: zodResolver(editAllotteeSchema),
    defaultValues: {
      name: "",
      relation: undefined,
      contactNumber: " ",
      address: "",
      province: undefined,
      city: undefined,
      bank: undefined,
      branch: undefined,
      accountNumber: "",
      //allotment: undefined,
    },
  });

  // Provinces (with search only)
  const filteredProvinces = useMemo(() => {
    if (!searchProvince.trim()) {
      return provinces;
    }

    return provinces.filter((province) =>
      province.ProvinceName.toLowerCase().includes(searchProvince.toLowerCase())
    );
  }, [provinces, searchProvince]);

  // Cities (with search + province filter)
  const filteredCities = useMemo(() => {
    const provinceId = form.watch("province") || editingAllottee?.province || 0;

    let filtered = cities;

    if (provinceId) {
      filtered = filtered.filter((city) => city.ProvinceID === provinceId);
    }

    if (searchCity.trim()) {
      filtered = filtered.filter((city) =>
        city.CityName.toLowerCase().includes(searchCity.toLowerCase())
      );
    }

    return filtered.slice(0, 100);
  }, [cities, searchCity, form.watch("province"), editingAllottee?.province]);

  const watchedBank = form.watch("bank"); // watch outside of useMemo

  const filteredBranch = useMemo(() => {
    const bankId =
      Number(watchedBank) ||
      Number(SelectedAllotteeData?.bankId) ||
      Number(selectedBankId) ||
      0;

    const matchedBank = uniqueBanks.find((b) => b.BankID === bankId);
    if (!matchedBank) return [];

    // Call the function correctly from the store
    let branchesForThisBank = getBranchesByBankId(bankId) || []; // ensure default []

    // Apply search filter
    if (searchBranch.trim()) {
      branchesForThisBank = branchesForThisBank.filter((b) =>
        b.BankBranchName.toLowerCase().includes(searchBranch.toLowerCase())
      );
    }

    //console.log("Filtered Branches:", branchesForThisBank);

    return branchesForThisBank.slice(0, 100);
  }, [
    watchedBank,
    SelectedAllotteeData?.bankId,
    selectedBankId,
    uniqueBanks,
    searchBranch,
    getBranchesByBankId,
  ]);

  const { reset } = form;

  useEffect(() => {
    if (!SelectedAllotteeData) return;

    const draftId = Number(SelectedAllotteeData.id);
    const draftData = drafts[draftId];

    // Only initialize if there’s no draft yet
    if (draftData && draftData.relationship !== undefined) return;

    const relationName = SelectedAllotteeData.relationship;
    const matchedRelation = allRelationshipData.find(
      (r) => r.RelationName === relationName
    );

    const relationId = matchedRelation?.RelationID
      ? Number(matchedRelation.RelationID)
      : SelectedAllotteeData.relationshipId
        ? Number(SelectedAllotteeData.relationshipId)
        : undefined;

    const currentRelation = form.getValues().relation;
    if (relationId !== currentRelation) {
      form.setValue("relation", relationId);
    }
  }, [SelectedAllotteeData, allRelationshipData, form]);

  useEffect(() => {
    if (!SelectedAllotteeData || provinces.length === 0 || cities.length === 0)
      return;

    const draftId = Number(SelectedAllotteeData.id);
    const draftData = drafts[draftId];

    // Only initialize if no draft exists yet
    if (
      draftData &&
      (draftData.province !== undefined || draftData.city !== undefined)
    )
      return;

    const provinceName = SelectedAllotteeData.province;
    const matchedProvince = provinces.find(
      (p) => p.ProvinceName === provinceName
    );
    const provinceId =
      matchedProvince?.ProvinceID ??
      (SelectedAllotteeData.provinceId
        ? Number(SelectedAllotteeData.provinceId)
        : undefined);

    const provinceCities = cities.filter((c) => c.ProvinceID === provinceId);
    const cityName = SelectedAllotteeData.city;
    const matchedCity = provinceCities.find((c) => c.CityName === cityName);
    const cityId =
      matchedCity?.CityID ??
      (SelectedAllotteeData.cityId
        ? Number(SelectedAllotteeData.cityId)
        : undefined);

    const currentProvince = form.getValues().province;
    const currentCity = form.getValues().city;

    if (provinceId !== currentProvince) form.setValue("province", provinceId);
    if (cityId !== currentCity) form.setValue("city", cityId);
  }, [SelectedAllotteeData, provinces, cities, form]);

  useEffect(() => {
    if (!SelectedAllotteeData || uniqueBanks.length === 0) return;

    const currentBankValue = form.getValues().bank;
    const currentBranchValue = form.getValues().branch;

    if (currentBankValue && currentBranchValue) {
      //console.warn("Form already has values, skipping init");
      return;
    }

    const matchedBank = uniqueBanks.find(
      (b) => b.BankName === SelectedAllotteeData.bankName
    );

    if (!matchedBank) return;

    if (!currentBankValue) {
      form.setValue("bank", matchedBank.BankID);
      setSelectedBankId(matchedBank.BankID);
    }

    if (!currentBranchValue && SelectedAllotteeData.bankBranch) {
      const branchesForThisBank = getBranchesByBankId(matchedBank.BankID);
      const matchedBranch = branchesForThisBank.find(
        (b) => b.BankBranchName === SelectedAllotteeData.bankBranch
      );
      if (matchedBranch) {
        form.setValue("branch", matchedBranch.BankBranchID);
      }
    }
  }, [SelectedAllotteeData, uniqueBanks, form, setSelectedBankId]);

  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!SelectedAllotteeData || !isInitialLoad.current) return;

    const draftId = Number(SelectedAllotteeData.id);
    const draftData = drafts[draftId] ?? {};

    const initialValues = {
      name: draftData.name ?? SelectedAllotteeData.name ?? "",
      contactNumber: draftData.contactNumber ?? SelectedAllotteeData.contactNumber ?? " ",

      address: draftData.address ?? SelectedAllotteeData.address ?? "",
      province: Number(
        draftData.province ?? SelectedAllotteeData.provinceId ?? undefined
      ),
      city: Number(draftData.city ?? SelectedAllotteeData.cityId ?? undefined),
      bank: Number(
        draftData.bank ?? SelectedAllotteeData.bankName ?? undefined
      ),
      branch: Number(
        draftData.branch ?? SelectedAllotteeData.bankBranch ?? undefined
      ),
      relation:
        draftData.relationship !== undefined
          ? Number(draftData.relationship)
          : SelectedAllotteeData.relationship !== undefined
            ? Number(SelectedAllotteeData.relationship)
            : undefined,
      accountNumber: String(
        draftData.accountNumber ?? SelectedAllotteeData.accountNumber ?? ""
      ),
      //allotment: draftData.allotment ?? SelectedAllotteeData.allotment ?? 0,
    };

    reset(initialValues);

    isInitialLoad.current = false;
  }, [SelectedAllotteeData, drafts, reset]);

  const handleSaveDraft = (data: EditAllotteeFormData) => {
    const draftId = Number(SelectedAllotteeData.id);

    const updatedDraft = {
      name: data.name,
      contactNumber: data.contactNumber ?? "",
      address: data.address,
      province: data.province,
      city: data.city,
      bank: data.bank,
      branch: data.branch,
      relationship: data.relation,
      accountNumber: data.accountNumber ?? "",
    };


    // Save to Zustand draft store
    setDraft(draftId, updatedDraft);
    setEditModalStatus(prev => ({
      ...prev,
      [draftId]: true,
    }));

    // Show toast
    toast({
      title: "Saved as draft",
      description: `${SelectedAllotteeData.name} has been updated in drafts.`,
      variant: "success",
    });

    // Close modal
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] bg-[#FCFCFC] p-10">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-semibold text-primary">
            {isEditingAllottee || isAddingAllottee ? "Edit Allottee" : "View Allottee"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="space-y-3 grid grid-cols-2 gap-4"
            onSubmit={form.handleSubmit(handleSaveDraft)}
          >
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              disabled={!isEditingAllottee && !isAddingAllottee}
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter name"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        setDraft(Number(SelectedAllotteeData.id), {
                          ...drafts[Number(SelectedAllotteeData.id)],
                          name: e.target.value,
                        });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Relationship */}
            <FormField
              control={form.control}
              name="relation"
              render={({ field, fieldState }) => {
                const draftId = Number(SelectedAllotteeData?.id);
                const currentDraft = drafts[draftId] ?? {};

                const value =
                  currentDraft.relationship ??
                  SelectedAllotteeData?.relationship ??
                  undefined;

                return (
                  <FormItem>
                    <FormLabel>Relationship</FormLabel>
                    <FormControl>
                      <Select
                        disabled={!isEditingAllottee && !isAddingAllottee}
                        value={field.value ? field.value.toString() : ""}
                        onValueChange={(val: string) => {
                          const numericValue = Number(val);
                          const draftId = Number(SelectedAllotteeData?.id);
                          const currentDraft = drafts[draftId] ?? {};

                          setDraft(draftId, {
                            ...currentDraft,
                            relationship: numericValue,
                          });
                          field.onChange(numericValue);
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            "w-full rounded-md h-10 gap-1",
                            fieldState.invalid
                              ? "border-red-500 focus:ring-red-500"
                              : "border-[#E0E0E0]"
                          )}
                        >
                          <SelectValue placeholder="Select Relationship" />
                        </SelectTrigger>
                        <SelectContent>
                          {allRelationshipData.map((rel) => (
                            <SelectItem
                              key={rel.RelationID}
                              value={rel.RelationID.toString()}
                            >
                              {rel.RelationName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {/* Contact Number */}
            <FormField
              control={form.control}
              name="contactNumber"
              disabled={!isEditingAllottee && !isAddingAllottee}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact Number</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      {...field}
                      placeholder="Enter contact number"
                      onChange={(e) => {
                        field.onChange(e); // react-hook-form update
                        setDraft(Number(SelectedAllotteeData.id), {
                          contactNumber: e.target.value, // <-- keep as string
                        });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="address"
              disabled={!isEditingAllottee && !isAddingAllottee}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter address"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e); // update react-hook-form
                        setDraft(Number(SelectedAllotteeData.id), {
                          address: e.target.value,
                        }); // update draft store
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Province */}
            <FormField
              control={form.control}
              name="province"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Province</FormLabel>
                  <FormControl>
                    <Select
                      disabled={!isEditingAllottee && !isAddingAllottee}
                      onValueChange={(value) => {
                        const numericValue = Number(value);
                        field.onChange(numericValue);

                        setDraft(Number(SelectedAllotteeData.id), {
                          ...drafts[Number(SelectedAllotteeData.id)],
                          province: numericValue,
                        });

                        // Reset city when province changes
                        form.setValue("city", undefined);
                      }}
                      value={
                        field.value !== undefined
                          ? String(field.value)
                          : undefined
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full rounded-md h-10 gap-1",
                          fieldState.invalid
                            ? "border-red-500 focus:ring-red-500"
                            : "border-[#E0E0E0]"
                        )}
                      >
                        <SelectValue placeholder="Select Province" />
                      </SelectTrigger>
                      <SelectContent>
                        {loading ? (
                          <SelectItem value="loading">Loading...</SelectItem>
                        ) : filteredProvinces.length > 0 ? (
                          filteredProvinces.map((province) => (
                            <SelectItem
                              key={province.ProvinceID}
                              value={province.ProvinceID.toString()}
                            >
                              {province.ProvinceName}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-sm text-gray-500">
                            No provinces found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* City */}
            <FormField
              control={form.control}
              name="city"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>City</FormLabel>
                  <FormControl>
                    <Select
                      disabled={!isEditingAllottee && !isAddingAllottee}
                      onValueChange={(value) => {
                        const numericValue = Number(value); // relationship ID
                        field.onChange(numericValue); // update react-hook-form
                        setDraft(Number(SelectedAllotteeData.id), {
                          city: numericValue,
                        }); // update draft in Zustand
                      }}
                      value={
                        field.value !== undefined
                          ? String(field.value)
                          : undefined
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full rounded-md h-10 gap-1",
                          fieldState.invalid
                            ? "border-red-500 focus:ring-red-500"
                            : "border-[#E0E0E0]"
                        )}
                      >
                        <SelectValue placeholder="Select City" />
                      </SelectTrigger>
                      <SelectContent>
                        {loading ? (
                          <SelectItem value="loading">Loading...</SelectItem>
                        ) : filteredCities.length > 0 ? (
                          filteredCities.map((city) => (
                            <SelectItem
                              key={city.CityID}
                              value={city.CityID.toString()}
                            >
                              {city.CityName}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-sm text-gray-500">
                            No cities found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bank */}
            <FormField
              control={form.control}
              name="bank"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Bank</FormLabel>
                  <FormControl>
                    <Select
                      disabled={!isEditingAllottee && !isAddingAllottee}
                      onValueChange={(value) => {
                        const numericValue = Number(value); // relationship ID
                        field.onChange(numericValue); // update react-hook-form
                        setDraft(Number(SelectedAllotteeData.id), {
                          bank: numericValue,
                        }); // update draft in Zustand
                      }}
                      value={
                        field.value !== undefined
                          ? field.value.toString()
                          : undefined
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full rounded-md h-10 gap-1",
                          fieldState.invalid
                            ? "border-red-500 focus:ring-red-500"
                            : "border-[#E0E0E0]"
                        )}
                      >
                        <SelectValue placeholder="Select Bank" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueBanks.map((bank) => (
                          <SelectItem
                            key={bank.BankID}
                            value={bank.BankID.toString()}
                          >
                            {bank.BankName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Branch */}
            <FormField
              control={form.control}
              name="branch"
              render={({ field, fieldState }) => (
                <FormItem>
                  <FormLabel>Branch</FormLabel>
                  <FormControl>
                    <Select
                      disabled={!isEditingAllottee && !isAddingAllottee}
                      onValueChange={(value) => {
                        const numericValue = Number(value);
                        field.onChange(numericValue); // store as number
                        setDraft(Number(SelectedAllotteeData.id), {
                          branch: numericValue,
                        });
                      }}
                      value={
                        field.value !== undefined
                          ? field.value.toString()
                          : undefined
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full rounded-md h-10 gap-1",
                          fieldState.invalid
                            ? "border-red-500 focus:ring-red-500"
                            : "border-[#E0E0E0]"
                        )}
                      >
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                      <SelectContent>
                        {loading ? (
                          <SelectItem value="loading">Loading...</SelectItem>
                        ) : filteredBranch.length > 0 ? (
                          filteredBranch.map((branches) => (
                            <SelectItem
                              key={branches.BankBranchID}
                              value={branches.BankBranchID.toString()}
                            >
                              {branches.BankBranchName}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-2 text-sm text-gray-500">
                            No branches found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Account Number */}
            <FormField
              control={form.control}
              name="accountNumber"
              disabled={!isEditingAllottee && !isAddingAllottee}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Account Number</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      {...field}
                      placeholder="Enter account number"
                      onChange={(e) => {
                        field.onChange(e); // update react-hook-form
                        setDraft(Number(SelectedAllotteeData.id), {
                          accountNumber: e.target.value, // string just updated
                        });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Allotment */}
            {/* <FormField
              control={form.control}
              name="allotment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Allotment</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      placeholder="Enter allotment"
                      onChange={(e) => {
                        field.onChange(e); // update react-hook-form
                        setDraft(Number(SelectedAllotteeData.id), {
                          allotment: Number(e.target.value), // convert to number
                        });
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {/* Actions */}
            <div className="col-span-2 flex gap-3 pt-4">
              <Button
                type="button"
                variant={isEditingAllottee || isAddingAllottee ? "outline" : "default"}
                className="flex-1"
                onClick={() => {
                  onOpenChange(false);
                  reset();
                }}
                disabled={isSubmitting}
              >
                Back
              </Button>
              {(isEditingAllottee || isAddingAllottee) && (
                <Button
                  type="submit"
                  className="flex-1 text-sm h-11 bg-primary hover:bg-primary/90"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    "Updating..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Draft
                    </>
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
